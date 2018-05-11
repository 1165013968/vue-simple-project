// import Vue from 'vue'
import { Loading, Message } from 'element-ui'
import axios from 'axios'
import { getToken } from '@/utils'

let loadingInstance

axios.defaults.baseURL = ''
axios.defaults.headers = {'X-Requested-With': 'XMLHttpRequest'}
axios.defaults.timeout = 10000

// interceptors request
axios.interceptors.request.use(config => {
  loadingInstance = Loading.service({ fullscreen: true })
  const token = getToken('mort_auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, error => {
  loadingInstance.close()
  return Promise.reject(error)
})

// interceptors response
axios.interceptors.response.use(response => {
  loadingInstance.close()
  return response
}, err => {
  loadingInstance.close()
  // response error
  err.message = '请求数据错误'
  Message.error({
    message: err.message,
    duration: 4000
  })
  return Promise.resolve(err.response)
})

export default {
  get (url, param, headers = {}) {
    return new Promise((resolve, reject) => {
      axios({
        method: 'get',
        url,
        params: param,
        headers: headers
      }).then(res => {
        resolve(res)
      })
    })
  },
  post (url, param, headers = {}) {
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url,
        data: param,
        headers: headers
      }).then(res => {
        resolve(res)
      })
    })
  }
}
