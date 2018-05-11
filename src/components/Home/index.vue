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
        :picker-options="startTimeRules">
      </el-date-picker>
      <span class="time-picker-interval">~</span>
      <el-date-picker
        v-model="endTime"
        type="date"
        value-format="yyyy-MM-dd"
        placeholder="选择日期"
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
              :label="cols"
              :formatter="formatOutput">
            </el-table-column>
          </template>
        </el-table>
      </div>
    </div>
  </article>
</template>

<script>
import Vue from 'vue'
import { DatePicker, Table, TableColumn } from 'element-ui'
import { getDatabaseAlias, getFieldAlias, getDataBySql } from '@/api'
import { orderList, queryArr, desp, noCollapse, formatDate, formatMoney, formatPer, FIRST_TERM_IMPAWN_DAY } from './config'
import('babel-polyfill')
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

function formatterDate (d, r = '-') {
  if (!(d instanceof Date)) return d
  return d.getFullYear() + r + (d.getMonth() + 1) + r + d.getDate()
}

function inArray (arr = [], item) {
  let idx = arr.indexOf(item)
  if (idx > -1) return true
  return false
}

export default {
  name: 'Home',
  data () {
    return {
      startTime: formatterDate(new Date(new Date().getFullYear() + '/01/01')),
      startTimeRules: {
        disabledDate (time) {
          // return time.getTime() <= Date.now()
        }
      },
      endTime: formatterDate(new Date()),
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
    request () {
      const id = this.aDataSetId
      if (!id) return
      Promise.all([getDatabaseAlias(id), getFieldAlias(id)]).then(([databaseAlias, fieldsAlias]) => {
        this.databaseAlias = databaseAlias && databaseAlias.data
        this.fieldsAlias = fieldsAlias && fieldsAlias.data
        this.fetchData()
      })
    },
    onSelectDate (date) {
      this.fetchData()
    },
    computeHeight () {
      let target = document.querySelector('.table-container')
      let top = target.offsetTop
      let screenHeight = window.innerHeight
      this.tableHeight = screenHeight - top
    },
    async fetchData () {
      let self = this
      let database = this.databaseAlias
      let fields = this.fieldsAlias
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
          tableHead[sidx] = displayName
          query[sidx] = codeName
        }
      })
      this.tableHead = tableHead.filter(field => field)
      sortField = sortField.filter(field => field).join(',')
      query = query.filter(field => field).join(',')

      let sql = `select ${query} 
        from ${database} 
        WHERE ${filterFields}>='${this.startTime}' 
        AND ${filterFields}<='${this.endTime}' 
        ORDER BY ${sortField}`
      let tableData = await getDataBySql({dataSetId: self.aDataSetId, sql: sql})
      // handle data
      this.tableData = collapse(tableData.data.rows, 10)
    },
    objectSpanMethod ({ row, column, rowIndex, columnIndex }) {
      // 已经在sql里面排好了顺序
      let label = column.label
      if (!(inArray(noCollapse, label))) {
        return {
          rowspan: row[row.length - 1][0],
          colspan: row[row.length - 1][1]
        }
      }
    },
    formatOutput (row, column, cellValue, index) {
      let label = column.label
      if (inArray(formatDate, label)) return cellValue.replace(/\s|-/g, '').slice(0, 8)
      if (inArray(formatMoney, label)) return Number(cellValue).toFixed(2).replace(/(\d{1,2})(?=(\d{3})+\.)/g, '$1,')
      if (inArray(formatPer, label)) return Number(cellValue).toFixed(2) + '%'
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
  font-size: 20px;
}
.table-container{
  overflow: auto;
}
body.el-date-table{
  font-size: 14px;
}
</style>
