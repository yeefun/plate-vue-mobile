<template>
 <div :class="className">
   <button @click="loadMore()" id="loadmore"><span>更多文章</span></button>
 </div>
</template>

<script>

export default {
  name: 'moreFull',
  methods: {
    loadMore () {
      this.$emit('loadMore')
    }
  },
  props: {
    className: {
      default: () => 'moreFull'
    }
  }
}

</script>
<style lang="stylus" scoped>
button-style(letter-spacing)
  display: flex
  justify-content: center
  align-items: center
  width 100%
  height 42px
  font-size 18px
  color #fff
  letter-spacing letter-spacing
  border none
  background-color #333
  > span
    margin 0 auto

.moreFull
  padding 0 40px
  margin-bottom 35px
  > button
    button-style(10px)

.moreFoodTravel
  margin 50px 5%
  > button
    button-style(1px)
</style>
