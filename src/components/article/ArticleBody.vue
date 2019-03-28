<template>
  <main class="article-body">
    <div class="post-info title"><h1 v-text="title"></h1></div>
    <div class="post-info subtitle"><h2 v-text="subtitle"></h2></div>
    <div class="post-info credit" v-html="credit"></div>
    <div class="post-sharer"><ShareLight :gtmCategory="'article'" /></div>
    <div class="post-leading">
      <HeroVideo v-if="heroVideo" class="article-heromedia" :heroCaption="heroCaption" :video="heroVideo" />
      <HeroImage v-else :heroCaption="heroCaption" :heroImage="heroImage" />
    </div>
    <ArticleBodyContent class="post-brief fb-quotable" :isBrief="true"
      :content="brief" :bgcolor="category.color || '#bcbcbc'" />
    <ArticleBodyContent class="post-content fb-quotable" :content="content">
      <RelatedListInContent :relateds="relateds" slot="relatedListInContent" />
      <slot name="ADAR1" slot="ADAR1"></slot>
      <slot name="ADAR2" slot="ADAR2"></slot>
    </ArticleBodyContent>
  </main>
</template>
<script>
  import { SECTION_MAP } from 'src/constants'
  import { filter, get, isObject, reduce } from 'lodash'
  import { getCredit, getImage } from 'src/util/comm'
  import ArticleBodyContent from 'src/components/article/ArticleBodyContent.vue'
  import HeroImage from 'src/components/article/HeroImage.vue'
  import HeroVideo from 'src/components/article/HeroVideo.vue'
  import RelatedListInContent from 'src/components/article/RelatedListInContent.vue'
  import ShareLight from 'src/components/share/ShareLight.vue'

  export default {
    name: 'ArticleBody',
    components: {
      ArticleBodyContent,
      HeroImage,
      HeroVideo,
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
      heroCaption () { return get(this.articleData, 'heroCaption', '') },
      heroImage () { return get(this.articleData, 'heroImage', { image: {}, }) },
      heroVideo () {
        const heroVideo = get(this.articleData, 'heroVideo')
        const poster = getImage(this.articleData)
        return get(heroVideo, 'video')
          ? Object.assign(get(heroVideo, 'video'), { id: get(heroVideo, 'id', '') }, { poster })
          : heroVideo
      },
      relateds () {
        const items = get(this.articleData, 'relateds', []) || []
        return items.filter(item => item)
      },      
      subtitle () { return get(this.articleData, 'subtitle') },
      title () { return get(this.articleData, 'title') },      
    },
    data () {
      return {}
    },
    mounted () {},
    props: {
      articleData: {}
    }
  }
</script>
<style lang="stylus" scoped>
.article-body
  font-family "Noto Sans TC", STHeitiTC-Light, "Microsoft JhengHei", sans-serif
  margin 0 auto
  padding 30px 0 0

  > div:not(.post-leading):not(.post-content)
    padding-right 25px
    padding-left 25px
    margin 25px 0

  .post-leading
    margin 40px 0
  .post-info
    &.title
      h1 
        font-size 2rem
        font-weight 400
        line-height 2.5rem
        color #000
        margin 15px 0 0
        text-align justify  
      & + div
        margin-top 25px  
    &.subtitle
      h2
        font-size 1.7rem
        margin 5px 0 25px 0
    &.credit
      text-align center
      >>> span
        color #000
        display inline-block
        line-height 1.5rem
        margin-right 10px
  .post-sharer
    text-align center
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
  
</style>