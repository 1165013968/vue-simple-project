<template>
  <article class="container">
    <div class="t-picker-wrap">
      <span>首期质押日: </span>
      <el-date-picker
        v-model="startTime"
        type="date"
        value-format="yyyy-MM-dd"
        placeholder="选择日期"
        @change="onSelectDate"
        size="small"
        :picker-options="startTimeRules">
      </el-date-picker>
      <span class="time-picker-interval">~</span>
      <el-date-picker
        v-model="endTime"
        type="date"
        value-format="yyyy-MM-dd"
        placeholder="选择日期"
        size="small"
        @change="onSelectDate">
      </el-date-picker>
    </div>
    <div class="table-wrapper">
      <h4
        :style="{'color': fontColor, 'backgroundColor': backgroundColor}">
        {{ tableTitle }}
      </h4>
      <div class="table-container">
        <el-table
          :data="tableData"
          :span-method="objectSpanMethod"
          border
          style="width: 100%;"
          :height="tableHeight">
          <template>
            <el-table-column
              v-for="(cols, index) in tableHead"
              v-if="index < tableHead.length - 1"
              :key="index"
              :prop="index.toString()"
              :label="cols.displayName"
              :type="cols.fieldName"
              :align="cols.align"
              header-align="center"
              className="reports-cell"
              :formatter="formatOutput">
            </el-table-column>
          </template>
        </el-table>
      </div>
    </div>
  </article>
</template>

<script>
import 'babel-polyfill'
import Vue from 'vue'
import { DatePicker, Table, TableColumn } from 'element-ui'
import { getDatabaseAlias, getFieldAlias, getDataBySql } from '@/api'
import { orderList, queryArr, desp, noCollapse, formatDate, formatMoney, formatPer, formatNum, FIRST_TERM_IMPAWN_DAY } from './config'
Vue.use(DatePicker)
Vue.use(Table)
Vue.use(TableColumn)

// const aDataSetId = '8f3535f6-9eb9-47f3-a50f-afd26a762b36'

// 计算表格合并依据
function collapse (array, index) {
  if (!(array instanceof Array) || !array.length) return []
  let idx = index || array.length - 1
  if (idx === -1) return []

  let currentFig = 0
  let currentTimes = 1
  const ilen = array.length
  for (let i = 0; i < ilen - 1; i++) {
    let cur = array[i]
    let next = array[i + 1]
    if (cur[idx] === next[idx]) {
      next[next.length] = [0, 0]
      currentTimes += 1
    } else {
      array[currentFig][array[currentFig].length] = [currentTimes, 1]
      currentFig = i + 1
      currentTimes = 1
    }
  }
  array[currentFig][array[currentFig].length] = [currentTimes, 1]
  return array
}

let resize = function (fn, timer) {
  let timeoutId = -1
  return function () {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(fn, timer)
  }
}

// function formatterDate (d, r = '-') {
//   if (!(d instanceof Date)) return d
//   return d.getFullYear() + r + (d.getMonth() + 1) + r + d.getDate()
// }

function inArray (arr = [], item) {
  let idx = arr.indexOf(item)
  if (idx > -1) return true
  return false
}

const getValue = (arr, key, fn) => {
  if (!arr.length) return []
  let max = -Infinity
  let min = Infinity
  arr.map((item, index) => {
    let temp = item[key]
    if (fn) temp = fn(temp)
    if (temp !== 0 && temp > max) max = temp
    if (temp !== 0 && temp < min) min = temp
  })
  return [ min, max ]
}

export default {
  name: 'Home',
  data () {
    // formatterDate(new Date(new Date().getFullYear() + '/01/01'))
    // formatterDate(new Date())
    return {
      startTime: '',
      startTimeRules: {
        disabledDate (time) {
          // return time.getTime() <= Date.now()
        }
      },
      endTime: '',
      initialize: false,
      databaseAlias: '',
      fieldsAlias: null,
      aDataSetId: '',
      tableTitle: '',
      fontColor: '',
      backgroundColor: '',
      tableHeight: '0',
      tableHead: [],
      tableData: []
    }
  },
  created () {
    const query = this.$route.query
    this.tableTitle = query.title || desp.DEFAULT_TITLE
    this.backgroundColor = '#' + (query.bgcolor || desp.DEFAULT_BG_COLOR)
    this.fontColor = '#' + (query.color || desp.DEFAULT_FONT_COLOR)
    this.aDataSetId = query.id
    this.request()
  },
  mounted () {
    window.addEventListener('resize', resize(this.computeHeight, 300))
    this.$nextTick(() => {
      this.computeHeight()
    })
  },
  methods: {
    async request () {
      const id = this.aDataSetId
      if (!id) return
      const [databaseAlias, fieldsAlias] = await Promise.all([getDatabaseAlias(id), getFieldAlias(id)])
      this.databaseAlias = databaseAlias && databaseAlias.data
      this.fieldsAlias = (fieldsAlias && fieldsAlias.data) || []
      this.refreshTable()
    },
    onSelectDate (date) {
      this.refreshTable()
    },
    computeHeight () {
      let target = document.querySelector('.table-container')
      let top = target.offsetTop
      let screenHeight = window.innerHeight
      this.tableHeight = screenHeight - top
    },
    async refreshTable () {
      // let self = this
      let database = this.databaseAlias
      let fields = this.fieldsAlias
      if (!database || !fields.length) return
      // 按照首期质押日刷选
      let filterFields
      let tableHead = Array.apply(null, {length: queryArr.length})
      let sortField = Array.apply(null, {length: orderList.length})
      let query = Array.apply(null, {length: queryArr.length})

      // 通过真实字段的对比，数据库字段与页面展示字段的映射关系，创建对应的sql查询字符串，对应的表格头部
      fields.map(({ codeName, fieldName, displayName }, index) => {
        let idx = orderList.indexOf(fieldName)
        if (idx > -1) sortField[idx] = codeName

        if (fieldName === FIRST_TERM_IMPAWN_DAY) filterFields = codeName

        let sidx = queryArr.indexOf(fieldName)
        if (sidx > -1) {
          if (displayName === '规模') displayName += '(万元)'
          let align = inArray(formatMoney, fieldName) || inArray(formatPer, fieldName) || inArray(formatNum, fieldName)
          tableHead[sidx] = {displayName: displayName, fieldName: fieldName, align: align ? 'right' : 'left'}
          query[sidx] = codeName
        }
      })
      this.tableHead = tableHead.filter(({fieldName}) => fieldName)
      sortField = sortField.filter(field => field).join(',')
      query = query.filter(field => field).join(',')

      let sql
      if (this.startTime && this.endTime) {
        sql = `select ${query} 
        from ${database} 
        WHERE ${filterFields}>='${this.startTime}' 
        AND ${filterFields}<='${this.endTime}' 
        ORDER BY ${sortField}`
      } else {
        sql = `select ${query} from ${database} ORDER BY ${sortField}`
      }
      let tableData = await getDataBySql({dataSetId: this.aDataSetId, sql: sql})
      // handle data
      this.tableData = collapse(tableData.data.rows)
      // when initialize , return
      if (this.initialize) return
      this.initialize = true
      const _key = queryArr.indexOf(FIRST_TERM_IMPAWN_DAY)
      const timeObject = getValue(tableData.data.rows, _key, (value) => {
        const result = Number(value.replace(/\s|-/g, '').slice(0, 8))
        if (isNaN(result)) return 0
        return result
      })
      if (!timeObject.length) return
      this.startTime = (timeObject[0] + '').replace(/(\d{4})(?=(\d{2})+)/g, '$1-')
      this.endTime = (timeObject[1] + '').replace(/(\d{4})(?=(\d{2})+)/g, '$1-')
    },
    objectSpanMethod ({ row, column, rowIndex, columnIndex }) {
      // 已经在sql里面排好了顺序
      let label = column['type']
      if (!(inArray(noCollapse, label))) {
        return {
          rowspan: row[row.length - 1][0],
          colspan: row[row.length - 1][1]
        }
      }
    },
    formatOutput (row, column, cellValue, index) {
      let label = column['type']
      if (inArray(formatDate, label)) return cellValue.replace(/\s/g, '').slice(0, 10)
      if (inArray(formatMoney, label)) return Number(cellValue).toFixed(2).replace(/(\d{1,2})(?=(\d{3})+\.)/g, '$1,')
      if (inArray(formatPer, label)) return Number(cellValue).toFixed(2) + '%'
      if (inArray(formatNum, label)) return (Number(cellValue) / 10000).toFixed(0)
      return cellValue
    }
  }
}
</script>

<style>
.container{
    height: calc(100% - 10px);
}
.t-picker-wrap{
  height: 40px;
  padding: 0 24px;
  text-align: left;
  white-space: nowrap;
}
.time-picker-interval{
  margin: 0 12px;
}
.table-wrapper{
  margin-top:12px;
}
.table-wrapper>h4{
  padding: 6px 24px;
  text-align: left;
  font-size: 16px;
}
.table-container{
  overflow: auto;
}
.table-container td.reports-cell, .table-container th.reports-cell{
  padding: 8px 0;
  font-weight: 400;
}
.table-container td.reports-cell>div, .table-container th.reports-cell>div{
  /* padding: 0 8px; */
}
body .el-date-table{
  font-size: 14px;
}
</style>
