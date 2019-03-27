<template>
  <footer class="footerFull">
    <div class="footerFull__logo">
      <router-link :to="'/section/' + this.sectionName" :style="{ height: getSectionLogoHeight() + 'px' }">
        <img :src="getSectionLogoUrl()" :style="{ width: getSectionLogoWidth() + 'px', height: getSectionLogoHeight() + 'px' }">
      </router-link>
    </div>
    <div class="footerFull__menu">
      <router-link :to="item.href" v-for="(item, i) in menuItem.section" v-text="item.title" :key="`${i}-${Date.now()}`"></router-link>
      <router-link :to="item.href" v-for="(item, i) in menuItem.category" v-text="item.title" :key="`${i}-${Date.now()}`"></router-link>
    </div>
    <div class="footerFull__vertDivider"></div>
    <div class="footerFull__link">
      <div class="footerFull__link--subscribe">
        <a :href="socialLink.SUBSCRIBE" id="footer-full-subscribe" target="_blank">訂閱鏡週刊</a> - <a :href="socialLink.AD" id="footer-full-ad" >廣告合作</a>
      </div>
      <div class="footerFull__link--horizDivider"></div>
      <div class="footerFull__link--socialMedia">
        <a :href="socialLink.FACEBOOK" id="footer-full-fb" target="_blank"><img class="facebook" src="/assets/mirrormedia/icon/facebook_white.png" alt="Facebook"></a>
        <a :href="socialLink.LINE" id="footer-full-line" target="_blank"><img class="line" src="/assets/mirrormedia/icon/line_white.png" alt="Line"></a>
        <a :href="socialLink.WEIBO" id="footer-full-weibo" target="_blank"><img class="weibo" src="/assets/mirrormedia/icon/weibo_white.png" alt="微博"></a>
      </div>
    </div>
  </footer>
</template>
<script>

import { SOCIAL_LINK } from '../constants/index'
import { forEach, find, get, } from 'lodash'

export default {
  name: 'footer-full',
  props: {
    commonData: {
      default: () => { return {} }
    },
    sectionName: ''
  },
  data () {
    return {
      socialLink: SOCIAL_LINK
    }
  },
  computed: {
    menuItem () {
      const menuItem = {}
      menuItem.section = []
      menuItem.category = []
      if (!this.commonData.sections) {
        return menuItem
      }
      forEach(this.commonData.sections.items, (s) => {
        s.href = '/section/' + s.name
        s.isFeatured ? menuItem.section.push(s) : ''
        forEach(s.categories, (c) => {
          c.href = '/category/' + c.name
          c.section = s.name
          c.isFeatured ? menuItem.category.push(c) : ''
        })
      })
      return menuItem
    },
    sectionLogo () {
      return get(find(get(this.commonData, [ 'sections', 'items' ]), { name: this.sectionName }), [ 'image' ], null)
    }
  },
  methods: {
    getSectionLogoUrl () {
      return get(this.sectionLogo, [ 'image', 'url' ]) ? get(this.sectionLogo, [ 'image', 'url' ]) : '/asset/logo.png'
    },
    getSectionLogoWidth () {
      return get(this.sectionLogo, [ 'image', 'width' ])
    },
    getSectionLogoHeight () {
      return get(this.sectionLogo, [ 'image', 'height' ])
    }
  }
}
</script>
<style lang="stylus" scoped>

.footerFull
  display flex
  flex-direction column
  justify-content space-between
  align-items stretch
  padding 40px 32px
  background-color #000

  a
    display block

  &__logo
    display flex
    justify-content center
    align-items center
    margin-bottom 40px

  &__menu
    display flex
    flex-wrap wrap
    width 100%
    margin-bottom 35px
    > a
      width 33%
      margin 15px 0
      font-size 18px
      font-weight 300
      color #fff
      text-align center

  &__vertDivider
    display none
    width 1px
    background-color #6e6e6e

  &__link
    display flex
    justify-content center
    align-items center
    flex-direction column
    &--subscribe
      margin-bottom 35px
      a
        display inline-block
        color #9fa1a0
        font-size 15px
    &--horizDivider
      display block
      width 100%
      height 1px
      margin-bottom 25px
      background-color #6e6e6e
    &--socialMedia
      display flex
      justify-content space-around
      width 100%

      > a
        height 22px

      .facebook, .line, .weibo
        height 22px

</style>
