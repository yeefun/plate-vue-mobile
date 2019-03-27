<template>
  <section class="articleListFull">
    <div class="articleListFull-post-container">
      <h2>最新新聞 Latest Stories</h2>
      <div class="articleListFull-posts">
        <template v-for="item in articles">
          <div class="articleListFull-post">
            <a :href="getHref(item)" target="_blank" class="articleListFull-post__img">
              <figure :style="{ backgroundImage: 'url(' + getImage(item, 'mobile') + ')' }" :title="get(item, [ 'title' ])"></figure>
            </a>
            <div class="articleListFull-post__content">
              <h2><a :href="getHref(item)" target="_blank" v-text="item.title"></a></h2>
              <div class="articleListFull-post__meta">
                <span class="articleListFull-post__meta--author" v-show="getAuthor(item, 'writers')" v-html="getAuthor(item, 'writers') + ' ｜ '"></span>
                <span class="articleListFull-post__meta--date" v-text="moment(new Date(item.publishedDate)).format('Y.MM.DD')"></span>
              </div>
              <p class="articleListFull-post__brief"><a :href="getHref(item)" target="_blank" v-text="getBrief(item, 70)"></a></p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script>
import { getAuthor, getBrief, getHref, getImage } from '../util/comm'
import { get } from 'lodash'
import moment from 'moment'

export default {
  name: 'articleList-full',
  components: {
  },
  props: [ 'articles' ],
  methods: {
    getAuthor,
    getBrief,
    getHref,
    getImage,
    get,
    moment
  }
}
</script>
<style lang="stylus" scoped>

.articleListFull
  padding 35px 0

  &-post-container
    padding 0 32px
    > h2
      position relative
      left 15px
      margin 0 0 20px
      font-size 22px
      font-weight 300
      color #000
    > h2:before
      content ""
      position absolute
      top 2px
      left -15px
      display inline-block
      width 5px
      height 20px
      background-color #000
  &-posts
    display flex
    flex-direction column
    > div
      padding 0
    > div:last-child
      margin 0

  &-post
    display flex
    flex-direction column
    margin 0 0 30px 
    &__img
      position relative
      left -32px
      width calc(100% + 64px)
      figure
        width 100%
        padding-top 66.66%
        margin 0
        background-position 50% 50%
        background-repeat no-repeat
        background-size cover
    &__content
      h2 
        margin 13px 0 0
        font-size 26px
        line-height 35px
        color #222
      p
        margin 0
        font-size 17px
        line-height 25px
        color #444
        text-align justify
    &__meta
      margin 10px 0
      &--author
        font-size 13px
        color #222
      &--date
        font-size 13px
        color #999
    &__brief
      display none
</style>
