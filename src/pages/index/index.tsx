import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Map, Input, Button, Text } from '@tarojs/components'
import * as turf from '@turf/turf'
import './index.scss'

// 默认坐标：北京天安门（当用户拒绝定位时使用）
const DEFAULT_LATITUDE = 39.908823
const DEFAULT_LONGITUDE = 116.397470

/** 地图标记点类型 */
interface MarkerItem {
    id: number
    latitude: number
    longitude: number
    title: string
    iconPath: string
    width: number
    height: number
    callout?: {
        content: string
        color: string
        bgColor: string
        borderRadius: number
        padding: number
        display: string
        fontSize: number
    }
}

/** 轨迹线坐标点 */
interface PolylinePoint {
    latitude: number
    longitude: number
}

/** 轨迹线配置 */
interface PolylineItem {
    points: PolylinePoint[]
    color: string
    width: number
    dottedLine: boolean
    arrowLine: boolean
    borderColor: string
    borderWidth: number
}

/** 途经点展示信息 */
interface WaypointInfo {
    name: string
    lat: string
    lng: string
}

/** 页面 State 类型 */
interface IndexState {
    latitude: number
    longitude: number
    targetDistance: number
    markers: MarkerItem[]
    polyline: PolylineItem[]
    locationReady: boolean
    generating: boolean
    waypoints: WaypointInfo[]
}

class Index extends Component<Record<string, never>, IndexState> {
    constructor(props: Record<string, never>) {
        super(props)
        this.state = {
            latitude: DEFAULT_LATITUDE,
            longitude: DEFAULT_LONGITUDE,
            targetDistance: 5,
            markers: [],
            polyline: [],
            locationReady: false,
            generating: false,
            waypoints: []
        }
    }

    componentDidMount() {
        this.getUserLocation()
    }

    /**
     * 获取用户真实定位
     * 如果用户拒绝，则 fallback 到默认坐标并给出提示
     */
    getUserLocation = (): void => {
        Taro.getLocation({
            type: 'gcj02',
            success: (res) => {
                console.log('定位成功:', res.latitude, res.longitude)
                this.setState({
                    latitude: res.latitude,
                    longitude: res.longitude,
                    locationReady: true,
                    markers: [this.createHomeMarker(res.latitude, res.longitude)]
                })
            },
            fail: (err) => {
                console.warn('定位失败:', err)
                Taro.showModal({
                    title: '定位提示',
                    content: '无法获取您的位置，将使用默认位置（北京天安门）。建议在设置中开启定位权限以获得最佳体验。',
                    showCancel: false,
                    confirmText: '我知道了'
                })
                this.setState({
                    locationReady: true,
                    markers: [this.createHomeMarker(DEFAULT_LATITUDE, DEFAULT_LONGITUDE)]
                })
            }
        })
    }

    /**
     * 创建"起点/家"的地图标记
     */
    createHomeMarker = (lat: number, lng: number): MarkerItem => {
        return {
            id: 0,
            latitude: lat,
            longitude: lng,
            title: '起点/家',
            iconPath: '',
            width: 30,
            height: 30,
            callout: {
                content: '🏠 起点/家',
                color: '#ffffff',
                bgColor: '#6c5ce7',
                borderRadius: 8,
                padding: 8,
                display: 'ALWAYS',
                fontSize: 14
            }
        }
    }

    /**
     * 创建途经点标记
     */
    createWaypointMarker = (id: number, lat: number, lng: number, label: string): MarkerItem => {
        return {
            id,
            latitude: lat,
            longitude: lng,
            title: label,
            iconPath: '',
            width: 24,
            height: 24,
            callout: {
                content: label,
                color: '#ffffff',
                bgColor: '#00b894',
                borderRadius: 8,
                padding: 6,
                display: 'ALWAYS',
                fontSize: 12
            }
        }
    }

    /**
     * 处理距离输入变化
     */
    onDistanceInput = (e: { detail: { value: string } }): void => {
        const value = parseFloat(e.detail.value)
        if (!isNaN(value) && value > 0) {
            this.setState({ targetDistance: value })
        }
    }

    /**
     * 核心算法：使用 Turf.js 生成闭环路线
     *
     * 原理：
     * 1. 以用户位置为圆心，根据目标总里程估算半径
     * 2. 在 0°(正北)、120°(右下)、240°(左下) 三个方向上计算途经点
     * 3. 将 起点 → 途经点1 → 途经点2 → 途经点3 → 起点 连成闭环
     *
     * 数学估算：
     * - 等边三角形周长 = 3 * 边长，边长 = R * √3
     * - 周长 = 3 * R * √3 ≈ 5.196 * R
     * - 半径 = 目标距离 / (3 * √3)
     */
    generateLoopRoute = (): void => {
        const { latitude, longitude, targetDistance } = this.state

        this.setState({ generating: true })

        try {
            const radius = targetDistance / (3 * Math.sqrt(3))

            const origin = turf.point([longitude, latitude])

            const bearings: number[] = [0, 120, 240]
            const directionNames: string[] = ['📍 途经点1 (北)', '📍 途经点2 (东南)', '📍 途经点3 (西南)']

            const waypointCoords: number[][] = bearings.map((bearing) => {
                const destination = turf.destination(origin, radius, bearing, { units: 'kilometers' })
                return destination.geometry.coordinates
            })

            const waypointMarkers: MarkerItem[] = waypointCoords.map((coord, index) => {
                return this.createWaypointMarker(
                    index + 1,
                    coord[1],
                    coord[0],
                    directionNames[index]
                )
            })

            const polylinePoints: PolylinePoint[] = [
                { latitude, longitude },
                ...waypointCoords.map((coord) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                })),
                { latitude, longitude }
            ]

            const lineCoords: number[][] = [
                [longitude, latitude],
                ...waypointCoords,
                [longitude, latitude]
            ]
            const line = turf.lineString(lineCoords)
            const actualLength = turf.length(line, { units: 'kilometers' })

            console.log(`目标距离: ${targetDistance}km, 估算半径: ${radius.toFixed(3)}km, 实际路线长度: ${actualLength.toFixed(2)}km`)

            this.setState({
                markers: [
                    this.createHomeMarker(latitude, longitude),
                    ...waypointMarkers
                ],
                polyline: [{
                    points: polylinePoints,
                    color: '#a29bfe',
                    width: 5,
                    dottedLine: false,
                    arrowLine: true,
                    borderColor: '#6c5ce7',
                    borderWidth: 2
                }],
                waypoints: waypointCoords.map((coord, index) => ({
                    name: directionNames[index],
                    lat: coord[1].toFixed(6),
                    lng: coord[0].toFixed(6)
                })),
                generating: false
            })

            Taro.showToast({
                title: `路线已生成 (${actualLength.toFixed(1)}km)`,
                icon: 'success',
                duration: 2000
            })
        } catch (error) {
            console.error('路线生成失败:', error)
            this.setState({ generating: false })
            Taro.showToast({
                title: '路线生成失败，请重试',
                icon: 'none',
                duration: 2000
            })
        }
    }

    render() {
        const {
            latitude,
            longitude,
            targetDistance,
            markers,
            polyline,
            generating,
            waypoints
        } = this.state

        return (
            <View className='index-page'>
                {/* ===== 控制面板 ===== */}
                <View className='control-panel'>
                    <View className='panel-header'>
                        <Text className='app-title'>🔄 LoopExplorer</Text>
                        <Text className='app-subtitle'>智能闭环运动路线规划</Text>
                    </View>

                    <View className='input-group'>
                        <View className='input-wrapper'>
                            <Text className='input-label'>目标距离</Text>
                            <View className='input-row'>
                                <Input
                                    className='distance-input'
                                    type='digit'
                                    value={String(targetDistance)}
                                    placeholder='输入距离'
                                    onInput={this.onDistanceInput}
                                />
                                <Text className='unit-text'>km</Text>
                            </View>
                        </View>

                        <Button
                            className={`generate-btn ${generating ? 'disabled' : ''}`}
                            onClick={this.generateLoopRoute}
                            disabled={generating}
                        >
                            {generating ? '⏳ 计算中...' : `🚀 生成 ${targetDistance}km 闭环`}
                        </Button>
                    </View>

                    {waypoints.length > 0 && (
                        <View className='waypoints-info'>
                            {waypoints.map((wp, idx) => (
                                <View className='waypoint-item' key={idx}>
                                    <Text className='waypoint-name'>{wp.name}</Text>
                                    <Text className='waypoint-coord'>{wp.lat}, {wp.lng}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* ===== 地图区域 ===== */}
                <View className='map-container'>
                    <Map
                        id='loopMap'
                        className='loop-map'
                        latitude={latitude}
                        longitude={longitude}
                        scale={14}
                        markers={markers}
                        polyline={polyline}
                        showLocation
                        enableZoom
                        enableScroll
                        enableRotate
                    />
                </View>
            </View>
        )
    }
}

export default Index
