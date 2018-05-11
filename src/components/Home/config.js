// 数据库字段与表格展示字段映射
export const reflect = {
  STAT_DT: '统计日期',
  FIRST_TERM_IMPAWN_DAY: '首期质押日',
  MATURE_BUYBACK_DAY: '到期回购日',
  BUYBACK_TYPE_NAME: '回购类型名称',
  BIZ_TYPE_CD: '业务类型代码',
  BIZ_TYPE_NAME: '业务类型名称',
  BOND_CD: '债券代码',
  BOND_SHNAME: '债券简称',
  CNTPTY_PART: '对手方',
  CAP_SIZE: '规模(万元)',
  SECU_INTER_CODE: '1111111111',
  BORR_AMT: '融入金额',
  MATURE_AMT: '到期金额',
  FIN_INT_RATE: '融资利率'
}
// 数据库查询order字段
export const orderList = ['SECU_INTER_CODE', 'MATURE_BUYBACK_DAY', 'FIRST_TERM_IMPAWN_DAY', 'BIZ_TYPE_NAME']
// 需要查询的字段、顺序
export const queryArr = ['BIZ_TYPE_NAME', 'FIRST_TERM_IMPAWN_DAY', 'MATURE_BUYBACK_DAY', 'BOND_CD', 'BOND_SHNAME', 'CAP_SIZE', 'CNTPTY_PART', 'BORR_AMT', 'MATURE_AMT', 'FIN_INT_RATE', 'SECU_INTER_CODE']
// 首期质押日对应字段
export const FIRST_TERM_IMPAWN_DAY = 'FIRST_TERM_IMPAWN_DAY'

export const desp = {
  DEFAULT_TITLE: '标题',
  DEFAULT_BG_COLOR: 'CCCC99',
  DEFAULT_FONT_COLOR: 'FFFFFF'
}

// 不需要合并单元格的字段
export const noCollapse = ['BOND_CD', 'BOND_SHNAME', 'CAP_SIZE']
export const formatDate = ['MATURE_BUYBACK_DAY', 'FIRST_TERM_IMPAWN_DAY']
export const formatMoney = ['BORR_AMT', 'MATURE_AMT']
export const formatPer = ['FIN_INT_RATE']
export const formatNum = ['CAP_SIZE']
