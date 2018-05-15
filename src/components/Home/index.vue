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
        size="small">
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
      <div class="table-container" :style="{'height': tableHeight + 'px'}">
        <table v-if="tableHead.length" class="v-table" width="100%" border="0" cellpadding="0" cellspacing="0">
          <thead>
            <tr>
              <th
                v-for="(cell, index) in tableHead"
                v-if="index < tableHead.length - 1"
                :key="index">
                <div>{{cell.displayName}}</div>
              </th>
            </tr>
            <tr><th class="animate-border" :colspan="tableHead.length - 1"></th></tr>
          </thead>
          <tbody v-if="tableData.length">
            <tr v-for="(rows, i) in tableData"
              :key="i">
              <td v-for="(item, index) in rows"
              v-if="(index < tableHead.length - 1) && (inArray(noCollapse, tableHead[index].fieldName) || rows[rows.length - 1][0])"
              :key="index"
              :class="[tableHead[index].align]"
              :rowspan="inArray(noCollapse, tableHead[index].fieldName) ? 1 : rows[rows.length - 1][0]">
              <div>{{formatOutput(item, index)}}</div></td>
            </tr>
          </tbody>
          <tbody v-if="!tableData.length"><tr><td :colspan="tableHead.length - 1">没有数据</td></tr></tbody>
        </table>
        <div v-else class="no-data">没有数据</div>
      </div>
    </div>
  </article>
</template>

<script>
import 'babel-polyfill'
import Vue from 'vue'
import { DatePicker } from 'element-ui'
import { getDatabaseAlias, getFieldAlias, getDataBySql } from '@/api'
import { orderList, queryArr, desp, noCollapse, formatDate, formatMoney, formatPer, formatNum, FIRST_TERM_IMPAWN_DAY } from './config'
Vue.use(DatePicker)

// const aDataSetId = '8f3535f6-9eb9-47f3-a50f-afd26a762b36'

// 计算表格合并依据
function collapse (array, index) {
  if (!(array instanceof Array) || !array.length) return []
  let idx = index || array[0].length - 1
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
// throttle
let resize = function (fn, timer) {
  let timeoutId = -1
  return function () {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(fn, timer)
  }
}
// judge an element is member of arr
function inArray (arr = [], item) {
  if (typeof item === 'object') return false
  let temp = typeof item === 'string' ? item.replace(/^\s|\s$/) : item
  let idx = arr.indexOf(temp)
  if (idx > -1) return true
  return false
}
// get max and min value by array[index].key
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

const createQuerySql = (fieldArray, filteredQuery, filteredOrder) => {
  let filterFields
  let sortField = Array.apply(null, {length: filteredOrder.length})
  let tableHead = Array.apply(null, {length: filteredQuery.length})
  let query = Array.apply(null, {length: filteredQuery.length})

  // 通过真实字段的对比，数据库字段与页面展示字段的映射关系，创建对应的sql查询字符串，对应的表格头部
  fieldArray.map(({ codeName, fieldName, displayName }, index) => {
    // 排序字段
    let idx = filteredOrder.indexOf(fieldName)
    if (idx > -1) sortField[idx] = codeName
    // 以首期质押日进行时间刷选
    if (fieldName === FIRST_TERM_IMPAWN_DAY) filterFields = codeName
    // 表格头部和查询字段对应
    let sidx = filteredQuery.indexOf(fieldName)
    if (sidx > -1) {
      if (displayName === '规模' || inArray(formatNum, fieldName)) displayName += '(万元)'
      let align = inArray(formatMoney, fieldName) || inArray(formatPer, fieldName) || inArray(formatNum, fieldName)
      tableHead[sidx] = {displayName: displayName, fieldName: fieldName, align: align ? 'is-right' : 'is-left'}
      query[sidx] = codeName
    }
  })
  // tableHead = tableHead.filter(({fieldName}) => fieldName)
  // sortField = sortField.filter(field => field).join(',')
  // query = query.filter(field => field).join(',')
  // 不能以首期质押日进行数据过滤
  // 不做异常处理，宁愿抛错也不希望数据不正确
  return {
    filterFields,
    tableHead,
    sortField: sortField.join(','),
    query: query.join(',')
  }
}

export default {
  name: 'Home',
  data () {
    return {
      startTime: '',
      endTime: '',
      // 缓存表名、数据字段名称
      databaseAlias: '',
      fieldsAlias: null,
      // props from url
      aDataSetId: '',
      tableTitle: '',
      fontColor: '',
      backgroundColor: '',
      filter: [],
      // table
      tableHeight: '0',
      tableHead: [],
      tableData: [],
      noCollapse: noCollapse
    }
  },
  created () {
    const query = this.$route.query
    this.tableTitle = query.title || desp.DEFAULT_TITLE
    this.backgroundColor = '#' + (query.bgcolor || desp.DEFAULT_BG_COLOR)
    this.fontColor = '#' + (query.color || desp.DEFAULT_FONT_COLOR)
    this.aDataSetId = query.id
    this.filter = (query.filter || '').split(',')
    this.request()
  },
  mounted () {
    window.addEventListener('resize', resize(this.computeHeight, 300))
    this.$nextTick(() => {
      this.computeHeight()
    })
    let target = document.querySelector('.table-container')
    target.addEventListener('scroll', function (e) {
      const scrollTop = this.scrollTop
      this.querySelector('thead').style.transform = 'translateY(' + scrollTop + 'px)'
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
    async refreshTable (database = this.databaseAlias, fields = this.fieldsAlias) {
      if (!database || !fields.length) return
      // 执行一次字段过滤
      let [ filteredQuery, filteredOrder ] = [ queryArr, orderList ]
      if (this.filter.length) {
        this.filter.map((item, index) => {
          let i = filteredQuery.indexOf(item)
          let j = filteredOrder.indexOf(item)
          if (i > -1) filteredQuery.splice(i, 1)
          if (j > -1) filteredOrder.splice(j, 1)
        })
      }
      // 生成sql语句需要的查询，排序，过滤字段,以及与查询字段顺序对应的表格头部
      const { filterFields, tableHead, sortField, query } = createQuerySql(fields, filteredQuery, filteredOrder)
      this.tableHead = tableHead
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
      // 生成表格数据合并的依据，并保存在数组最后一行
      this.tableData = collapse(tableData.data.rows)
      // 如果开始时间和结束时间都存在了，那么认为是已经初始化过的，这时不需要写ru时间了
      if (this.startTime && this.endTime) return
      const key = filteredQuery.indexOf(FIRST_TERM_IMPAWN_DAY)
      const [ startTime, endTime ] = getValue(tableData.data.rows, key, (value) => {
        const result = Number(value.replace(/\s|-/g, '').slice(0, 8))
        return isNaN(result) ? 0 : result
      })
      // 格式化为yyyy-mm-dd的时间格式
      let regExp = /(\d{4})(?=(\d{2})+)/g
      this.startTime = startTime.toString().replace(regExp, '$1-')
      this.endTime = endTime.toString().replace(regExp, '$1-')
    },
    formatOutput (cellValue, index) {
      let type = this.tableHead[index].fieldName
      if (inArray(formatDate, type)) return cellValue.replace(/\s/g, '').slice(0, 10)
      if (inArray(formatMoney, type)) return Number(cellValue).toFixed(2).replace(/(\d{1,2})(?=(\d{3})+\.)/g, '$1,')
      if (inArray(formatPer, type)) return Number(cellValue).toFixed(2) + '%'
      if (inArray(formatNum, type)) return Number(cellValue).toFixed(0)
      return cellValue
    },
    inArray (arr, item) {
      return inArray(arr, item)
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
/**table**/
.table-container{
  overflow: auto;
  border: 1px solid #e4e4e4;
  box-sizing: border-box;
}
.v-table{
  width: 100%;
  font-size: 14px;
  color: #6f6f6f;
}
.v-table th, .v-table td{
  border-right: 1px solid #e4e4e4;
  border-bottom: 1px solid #e4e4e4;
  padding: 8px;
  vertical-align: middle;
}
.v-table th{
  border-bottom: 0;
  background: #fff;
}
.v-table th>div, .v-table td>div{
  line-height: 1.5;
  white-space: nowrap;
  font-weight: 400;
}
.v-table .is-left{
  text-align: left;
}
.v-table .is-right{
  text-align: right;
}
.v-table tr:hover{
  background: #f3f3f3;
}
.v-table th.animate-border{
  height: 1px;
  padding: 0;
  border: 0;
  background: #e4e4e4;
}
.no-data{
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #504d4d;
}
</style>
