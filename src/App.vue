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
  min-width: 600px;
  margin: 0 auto;
  padding: 0;
  color: #2c3e50;
  text-align: center;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.header{
  height: 10px;
}
.footer{}
</style>
