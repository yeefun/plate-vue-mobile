<template>
  <footer class="left">
    <div class="mobile-follow">
      <a :href="SOCIAL_LINK.SUBSCRIBE" target="_blank" @click="sendGaClickEvent('footer', 'footer subscribe')">訂閱鏡週刊</a> - 
      <a href="/story/ad1018001" target="_blank" @click="sendGaClickEvent('footer', 'footer ad')">廣告合作</a> - 
      <a href="/category/campaign" target="_blank" @click="sendGaClickEvent('footer', 'footer activity')">活動專區</a>
    </div>
  </footer>
</template>
<script>
  import { SOCIAL_LINK } from '../constants'
  import { sendGaClickEvent } from '../util/comm'

  export default {
    name: 'AppFooter',
    data () {
      return {
        SOCIAL_LINK
      }
    },
    methods: {
      sendGaClickEvent
    }
  }
</script>
<style lang="stylus" scoped>
  footer 
    display flex
    padding 1rem 2rem 0
    justify-content space-between
    margin-top 20px
    margin-bottom 40px
    border-top none
    font-family "Noto Sans TC", STHeitiTC-Light, "Microsoft JhengHei", sans-serif

    .mobile-follow
      width 100%
      border 1px solid rgba(0, 0, 0, 0.19)
      margin-bottom 20px
      padding 10px 20px
      box-shadow 0 0 10px rgba(0, 0, 0, 0.2)
      font-size 1.2rem
      color rgba(0, 0, 0, 0.4)
      text-align center

      > a 
        &:hover, &:link, &:visited
          color rgba(0, 0, 0, 0.4)    
      
  @media (min-width 767px)
    footer
      padding-top 15px
      padding-bottom 50px    
      
</style>
