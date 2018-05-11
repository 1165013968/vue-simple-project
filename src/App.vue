<template>
  <div id="app">
    <header class="header"></header>
    <router-view/>
    <footer class="footer"></footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  color: #2c3e50;
  text-align: center;
  font-family: 'Microsoft YaHei';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.header{
  height: 10px;
}
.footer{}
</style>
