<template>
  <div :class="abIndicator.toLowerCase()" class="share-light">
    <!-- <span>{{ `${abIndicator} ${!abIndicator} ${abIndicator !== 'B'}`  }}</span> -->
    <button class="facebook" @click="shareFacebook">
      <span v-if="abIndicator === 'B'">分享至 Facebook</span>
      <img v-else src="/assets/mirrormedia/icon/share-fb.png" alt="分享至 Facebook">
    </button>
    <button class="line" @click="shareLine">
      <span v-if="abIndicator === 'B'">分享至 LINE</span>
      <img v-else src="/assets/mirrormedia/icon/share-line.png" alt="分享至 Line">
    </button>
  </div>
</template>
<script>

import { sendGaClickEvent, shareLine, shareFacebook } from '../../util/comm'

export default {
  name: 'ShareLight',
  props: {
    abIndicator: {
      type: String,
      default: 'A'
    },
    gtmCategory: {
      type: String,
      default: 'header'
    }
  },
  methods: {
    shareFacebook () {
      shareFacebook({ route: this.$route.path })
      sendGaClickEvent(this.gtmCategory, 'share fb')
    },
    shareLine () {
      shareLine({
        route: this.$route.path,
        title: document.querySelector('meta[property="og:title"]').getAttribute('content')
      })
      sendGaClickEvent(this.gtmCategory, 'share line')
    },
  }
}
</script>
<style lang="stylus" scoped>
.share-light
  display flex
  justify-content center
  align-items flex-start
  button
    display inline-block
    width 35px
    padding 0
    font-size 0
    background-color transparent
    border none
    cursor pointer
    & + button
      margin-left 10px
    img
      width 100%
  &.b
    button
      flex 1
      padding 1em 0
      color #fff
      font-size .75rem
      border-radius 35px
      & + button
        margin-left 15px
      &.facebook
        background-color #4267b2
      &.line
        background-color #00b900
</style>
