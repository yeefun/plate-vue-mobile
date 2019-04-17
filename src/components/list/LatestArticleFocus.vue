<template>
  <div class="group">
    <a
      class="group__hero-image"
      :href="getHref(groupedArticle)"
      target="_blank"
      rel="noopener"
      @click="sendGaClickEvent('home', 'group')">
      <LazyImage :src="getImage(groupedArticle, 'mobile')" />
    </a>
    <div class="group__articles articles">
      <a
        class="articles__item"
        :href="getHref(groupedArticle)"
        target="_blank"
        rel="noopener"
        @click="sendGaClickEvent('home', 'group')"
        v-text="getTruncatedVal(groupedArticle.title, 22)">
      </a>
      <a
        v-for="(article, i) in get(groupedArticle, 'relateds').slice(0, 3)"
        :key="i"
        class="articles__item"
        :href="getHref(article)"
        target="_blank"
        rel="noopener"
        @click="sendGaClickEvent('home', 'group')"
        v-text="getTruncatedVal(article.title, 22)">
      </a>
    </div>
  </div>
</template>

<script>
import { getHref, getHrefFull, getImage, getTruncatedVal, sendGaClickEvent } from 'src/util/comm'
import { get, } from 'lodash'
import LazyImage from 'src/components/common/LazyImage.vue'


export default {
  name: 'LatestArticleFocus',
  props: {
    groupedArticle: {
      type: Object,
      required: true
    }
  },
  components: {
    LazyImage
  },
  computed: {
    shouldGetHrefFull () {
      const exp = /(projects|campaign|readr)/
      return exp.test(this.groupedArticle.style)
    }
  },
  methods: {
    getHref (group) {
      return this.shouldGetHrefFull ? getHrefFull(group) : getHref(group)
    },

    getImage,
    getTruncatedVal,
    get,
    sendGaClickEvent
  }
}
</script>

<style lang="stylus" scoped>
.group
  margin 0 0 25px 0
  &:last-child
    margin 0
  &__hero-image
    img
      width 100%
  &__articles
    margin 3px 0 0 0

.articles
  &__item
    display inline-block
    padding 10px 0
    color rgba(0, 0, 0, 0.65)
    font-size 20.8px
    font-weight 300
    line-height 1.31
    text-align justify
    min-width 100%
    & + &
      border-top solid 2px #d7d7d7
</style>

