<template>
  <section id="editorChoice" class="editorChoice">
    <div class="editorChoice__eyebrow"><h2>編輯精選</h2></div>
    <div class="editorChoice__block"
      v-for="(item, index) in editorChoice"
      :class="{ first: index === 0 }">
      <router-link class="editorChoice__block--img" v-if="item.style !== 'projects'"
        :to="getHref(item)"
        :target="target"
        @click.native="sendGaClickEvent('home', 'choice')">
        <EditorChoiceItem
          :src="getImage(item, 'mobile')"
          :srcset="getSrcSet(get(item, 'heroImage.image'))"
          :id="get(item, 'heroImage.id', Date.now())"
          :css="getSectionStyle(get(item, 'sections.0', ''))"
          :section="get(item, 'sections.0.title', '')"
          :title="getTitle(item, 24)" />
      </router-link>
      <a class="editorChoice__block--img" v-else
        :href="`https://www.mirrormedia.mg${getHref(item)}`"
        :target="target"
        @click="sendGaClickEvent('home', 'choice')">
        <EditorChoiceItem
          :src="getImage(item, 'mobile')"
          :srcset="getSrcSet(get(item, 'heroImage.image'))"
          :id="get(item, 'heroImage.id', Date.now())"
          :css="getSectionStyle(get(item, 'sections.0', ''))"
          :section="get(item, 'sections.0.title', '')"
          :title="getTitle(item, 24)" />
      </a>
    </div>
  </section>
</template>
<script>
import { SECTION_MAP } from 'src/constants'
import { getHref, getImage, getSection, getTitle, getTruncatedVal, sendGaClickEvent } from 'src/util/comm'
import { get } from 'lodash'
import EditorChoiceItem from 'src/components/EditorChoiceItem.vue'

export default {
  name: 'editorChoice',
  components: {
    EditorChoiceItem
  },
  props: {
    editorChoice: {
      default: () => []
    },
    target: {
      default: () => '_self'
    },
  },
  methods: {
    get,
    getHref,
    getSrcSet (img) {
      return `${img.resizedTargets.mobile.url} 600w, ${img.resizedTargets.tablet.url} 900w`
    },
    getImage,
    getSection,
    getTitle,
    getTruncatedVal,
    getSectionStyle (sect) {
      const sectionId = get(sect, 'id')
      return { backgroundColor: get(SECTION_MAP, `${sectionId}.bgcolor`, '#bcbcbc') }
    },
    sendGaClickEvent,
  }
}
</script>
<style lang="stylus" scoped>

.editorChoice
  width 100%
  margin-bottom 30px
  &__eyebrow
    color #356d9c
    width 100%
    margin 0 auto 10px    
    padding 0 20px
    h2
      margin 0
      overflow hidden
  &__block
    border-bottom 1px solid #fff

    &--img
      color #fff
      display block
      padding-top 56.25%
      position relative
      
    
@media (min-width: 600px)
  .editorChoice
    display flex
    flex-wrap wrap
    justify-content space-between
    margin-bottom 40px

    &__eyebrow
      width 100%
      margin-bottom 40px
      color #356d9c   
      display flex  
      align-items center
      &::after
        flex 1
        content ""
        height .5em
        vertical-align middle
        width 100%
        margin-left 10px
        border-top 5px solid #356d9c    
    &__block
      border 1px solid #fff
      &.first
        width 100%
      &:not(.first)
        width 47%
        margin-top 5%
      &--img
        padding-top calc(56.25% + 40px)
</style>
