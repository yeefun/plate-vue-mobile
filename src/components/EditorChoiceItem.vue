<template>
  <div>
    <div class="figure">
      <LazyImage
        :src="src"
        :srcset="srcset"
        :id="id"
        :key="id" />
    </div>
    <div class="title">
      <span class="label" :style="css" v-text="section"></span>
      <span class="content" v-text="title"></span>
    </div>      
  </div>  
</template>
<script>
  import LazyImage from 'src/components/common/LazyImage.vue'
  export default {
    name: 'EditorChoiceItem',
    props: {
      src: {},
      srcset: {},
      id: {},
      css: {},
      section: {},
      title: {}
    },
    components: {
      LazyImage,
    }
  }
</script>
<style lang="stylus" scoped>
.figure
  position absolute
  width 100%
  height 100%
  top 0
  left 0
  z-index 1
  display flex
  justify-content center
  img
    width 100%
    height 100%
    object-fit cover
    object-position center center

.title
  position absolute
  bottom 0
  left 0
  width 100%       
  height 100% 
  display flex
  padding 1rem 5%
  flex-direction column
  justify-content flex-end
  align-items flex-start
  z-index 2

  .content
    font-size 1.25rem
    line-height 1.6rem
    font-weight normal
    color #fff
    text-shadow 1.4px 1.4px 1.9px rgba(0, 0, 0, 0.2)

  .label
    display flex
    justify-content center
    align-items center
    font-size 1rem       
    white-space nowrap
    height 30px
    padding 0 0.5em
    margin 5px 0
</style>