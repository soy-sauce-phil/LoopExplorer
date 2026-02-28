export default defineAppConfig({
    pages: [
        'pages/index/index'
    ],
    window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#1a1a2e',
        navigationBarTitleText: 'LoopExplorer',
        navigationBarTextStyle: 'white'
    },
    permission: {
        'scope.userLocation': {
            desc: '你的位置信息将用于规划闭环运动路线'
        }
    },
    requiredPrivateInfos: [
        'getLocation'
    ]
})
