import http from './http.js'

export const getDatabaseAlias = aDataSetId => {
  return http.get(`/mort/data-sets/${aDataSetId}/table`)
}

export const getFieldAlias = aDataSetId => {
  return http.get(`/mort/data-sets/${aDataSetId}/fields`)
}

export const getDataBySql = params => {
  return http.post(`/mort/analysis-result/sql`, params, {
    'Content-Type': 'application/json'
  })
}
