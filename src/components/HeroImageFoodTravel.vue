<template>
  <div class="heroimageFoodTravel">
    <div class="heroimage-container">
      <!--<img class="heroimage" src="/assets/mirrormedia/foodtravelheroimg.jpg" alt="">-->
      <img class="heroimage" :src="get(leadingImg, [ 'image', 'resizedTargets', 'tablet', 'url' ])" alt="">
    </div>
    <img class="section-title" :src="getSectionLogoUrl()" alt="">
  </div>
</template>

<script>
import { find, get } from 'lodash'

export default {
  computed: {
    leadingImg () {
      return get(this.commonData.sections.items.find((o) => o.name === 'foodtravel'), [ 'heroImage' ])
    },
    sectionLogo () {
      return get(find(get(this.commonData, [ 'sections', 'items' ]), { name: this.sectionName }), [ 'image' ], null)
    }
  },
  methods: {
    get,
    getSectionLogoUrl () {
      return get(this.sectionLogo, [ 'image', 'url' ]) ? get(this.sectionLogo, [ 'image', 'url' ]) : '/asset/logo.png'
    }
  },
  props: [ 'commonData', 'sectionName' ]
}
</script>

<style lang="stylus" scoped>
.heroimageFoodTravel
  position relative
  margin-top 50px
  .heroimage-container
    display flex
    align-items center
    overflow hidden
    .heroimage
      width 100%

  .section-title
    position absolute
    width 40%
    left 5%
    bottom 2%

</style>
