import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home/index'
import NotFound from '@/components/NotFound/index'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    }, {
      path: '/home',
      name: 'Home',
      component: Home
    }, {
      path: '*',
      name: 'NotFound',
      component: NotFound
      // component: r => {
      //   require.ensure([], () => r(require('@/components/NotFound/index')), 'notfound')
      // }
    }
  ]
})
