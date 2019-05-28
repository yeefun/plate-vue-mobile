<template>
  <main :class="abIndicator.toLowerCase()" class="article-body">
    <div class="post-info category date">
      <div class="category-item"><span class="categorySquare" v-if="!isAd" v-text="category.categoryTitle" :style="category.style"></span></div>
      <div class="date-item" v-text="date"></div>
    </div>  
    <div class="post-info title"><h1 v-text="title"></h1></div>
    <div v-if="subtitle" class="post-info subtitle"><h2 v-text="subtitle"></h2></div>
    <div :class="[ abIndicator === 'B' ? 'ab-test' : '' ]">
      <div class="post-sharer tts">
        <AudioPlayer class="tts" :post="articleData" />
        <ShareLight :abIndicator="abIndicator" :gtmCategory="'article'" />
      </div>
      <div class="post-info credit" v-html="credit"></div>
    </div>
    <div class="post-leading">
      <HeroVideo v-if="heroVideo" class="article-heromedia" :heroCaption="heroCaption" :video="heroVideo" />
      <HeroImage v-else :heroCaption="heroCaption" :heroImage="heroImage" />
    </div>
    <ArticleBodyContent class="post-brief fb-quotable" :isBrief="true"
      :content="brief" :bgcolor="category.color || '#bcbcbc'">
      <slot name="ADAR1" slot="ADAR1"></slot>
    </ArticleBodyContent>
    <ArticleBodyContent class="post-content fb-quotable" :content="content"
      :publishedDate="articleData.publishedDate" :updatedAt="articleData.updatedAt" >
      <RelatedListInContent :relateds="relateds" slot="relatedListInContent">
        <MicroAd v-for="ad in get(microAds, 'article')"
          class="related"
          :currEnv="dfpMode" :currUrl="articleUrl"
          :id="`${get(ad, 'pcId')}`"
          :key="`${get(ad, 'pcId')}`" /> 
      </RelatedListInContent>
    </ArticleBodyContent>
  </main>
</template>
<script>
  import { SECTION_MAP } from 'src/constants'
  import { microAds } from 'src/constants/microAds'
  import { filter, get, isObject, reduce } from 'lodash'
  import { getCredit, getImage } from 'src/util/comm'
  import ArticleBodyContent from 'src/components/article/ArticleBodyContent.vue'
  import AudioPlayer from 'src/components/audioPlayer/Container.vue'
  import HeroImage from 'src/components/article/HeroImage.vue'
  import HeroVideo from 'src/components/article/HeroVideo.vue'
  import MicroAd from 'src/components/MicroAd.vue'
  import RelatedListInContent from 'src/components/article/RelatedListInContent.vue'
  import ShareLight from 'src/components/share/ShareLight.vue'
  import moment from 'moment'

  export default {
    name: 'ArticleBody',
    components: {
      ArticleBodyContent,
      AudioPlayer,
      HeroImage,
      HeroVideo,
      MicroAd,
      RelatedListInContent,
      ShareLight,
    },
    computed: {
      brief () {
        return filter(get(this.articleData, 'brief.apiData', []), p => {
          const content = p.content || []
          const reduced = reduce(content, (sum, n) => sum + isObject(n) ? '(OBJECT)' : n.trim(), '')
          return reduced ? p : undefined
        })
      },
      category () {
        const sectionId = get(this.articleData, 'sections.0.id', '')
        const sectionTitle = get(this.articleData, 'sections.0.title', '')
        const categoryId = get(this.articleData, 'categories.0.id', '')
        const categoryTitle = get(this.articleData, 'categories.0.title', sectionTitle)
        const shouldShow = !get(this.articleData, 'isAdvertised', false) ? {} : { display: 'none;' }
        const style = { borderLeft: `7px solid ${get(SECTION_MAP, `${sectionId}.bgcolor`, '#bcbcbc')}` }
        const color = get(SECTION_MAP, `${sectionId}.bgcolor`, '#bcbcbc')
        return { categoryId, categoryTitle, style: Object.assign(style, shouldShow), color }
      },
      content () { return get(this.articleData, 'content.apiData', []) },      
      credit () { return getCredit(this.articleData, 'blue') },
      date () {
        const publishedDate = get(this.articleData, 'publishedDate', '')
        const normalizedDt = new Date(publishedDate)
        const datetime = moment(normalizedDt).format('YYYY.MM.DD HH:mm')
        return datetime
      },      
      heroCaption () { return get(this.articleData, 'heroCaption', '') },
      heroImage () { return get(this.articleData, 'heroImage', { image: {}, }) },
      heroVideo () {
        const heroVideo = get(this.articleData, 'heroVideo')
        const poster = getImage(this.articleData)
        return get(heroVideo, 'video')
          ? Object.assign(get(heroVideo, 'video'), { id: get(heroVideo, 'id', '') }, { poster })
          : heroVideo
      },
      isAd () {
        return get(this.articleData, 'isAdvertised', false)
      },
      relateds () {
        const items = get(this.articleData, 'relateds', []) || []
        return items.filter(item => item)
      },      
      subtitle () { return get(this.articleData, 'subtitle') },
      title () { return get(this.articleData, 'title') },      
    },
    data () {
      return {
        microAds
      }
    },
    methods: {
      get
    },
    mounted () {},
    props: {
      abIndicator: {
        type: String,
        default: 'A'
      },
      articleData: {},
      articleUrl: {},
      dfpMode: {},
    }
  }
</script>
<style lang="stylus" scoped>
.article-body
  font-family "Noto Sans TC", STHeitiTC-Light, "Microsoft JhengHei", sans-serif
  margin 0 auto
  padding 0

  > div:not(.post-leading):not(.post-content):not(.post-sharer)
    padding-right 20px
    padding-left 20px
    margin 0

  .post-leading
    margin 40px 0
  .post-info
    &.title
      h1 
        font-size 1.75rem
        font-weight 400
        line-height 1.25
        color #000
        margin 13px 0 0
        text-align justify  
      & + div
        margin-top 25px  
    &.subtitle
      h2
        font-size 1.7rem
        margin 5px 0 25px 0
    &.credit
      margin-top 25px !important
      >>> span
        color #000
        display inline-block
        line-height 1.5rem
        margin-right 10px
    &.category.date
      display flex
      margin-top 20px
      justify-content space-between
      align-items flex-end
    &.category
      .category-item
        font-size 21px
        display flex
        justify-content flex-start
        align-items center

        .categorySquare 
          display inline-flex
          height 24px
          padding-left 10px
          justify-content center
          align-items center    
    &.date
      .date-item
        font-style italic
        font-size 17px
        color #a1a1a1
        font-weight normal
  .post-sharer
    display flex
    align-items center
    width calc(100% - 50px)
    margin 25px auto
    padding 0 25px
    > div
      & + div
        margin-left 20px
    &.tts
      // width calc(100% - 40px)
      width 100%
      padding 0 !important
      > .player
        flex 1
        justify-content flex-start
  .post-brief
    margin-top 60px
    line-height 36px
    font-size 1.125rem
    color rgba(65, 65, 65, 0.6)

    >>> p 
      margin 0
      padding 1em 2em
      text-align justify
      color #fff
      font-weight bold
      font-size 1.2rem
      a
        color #fff
        border-bottom-color #fff
      strong 
        font-weight bold

      em
        font-weight bold
      
      i, cite, var, address, dfn 
        font-style normal
    >>> .ad-container
      line-height normal
  .ab-test
    display flex
    flex-direction column
    .post-sharer.tts
      order 2
      margin 25px auto 0
    .credit
      order 1
  &.b
    .post-sharer
      flex-direction column
      flex-wrap wrap
      > .player
        order 2
        width 100%
        margin-top 2em
        >>> .player__middle
          flex 1
      > div:not(.tts)
        width 100%
        margin-left 0
      
@media (min-width 400px)
  .article-body
    > div:not(.post-leading):not(.post-content), > div:not(.post-leading):not(.post-content):not(.post-sharer)
      padding-right 40px
      padding-left 40px
    .post-sharer
      &.tts
        // width calc(100% - 80px)
        width 100%
</style>