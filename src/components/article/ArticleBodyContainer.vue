<template>
  <div class="article-body-container article-container" v-if="articleStyle !== 'photography'">
    <ArticleBody :articleData="articleData" :dfpMode="dfpMode" :articleUrl="articleUrl">
      <slot name="ADAR1" slot="ADAR1" ></slot> 
    </ArticleBody>
    <slot name="ADAR2"></slot>
    <LazyItemWrapper :position="verge.viewportH()">
      <RecommendList
        v-if="!isAd"
        v-show="recommendlist.length > 0"
        :isAd="isAd"
        :sectionId="sectionId"
        :currArticleId="currArticleId"
        :recommends="recommendlist"
        :excludingArticle="routeUpateReferrerSlug"
      />
      <Newsletter />
      <div class="news-letter-label">更多內容，歡迎
        <a :href="SOCIAL_LINK.SUBSCRIBE" target="_blank">訂閱鏡週刊</a>、
        <a :href="SOCIAL_LINK.AUTH" target="_blank">了解內容授權資訊</a>。</div>
      <div class="article-tags">
        <p>相關關鍵字：</p>
        <div class="tags" v-html="tags" v-if="tags.length > 0"></div>    
      </div>
      <div class="facebook-page">
        <div class="fb-page" data-href="https://www.facebook.com/mirrormediamg/" data-adapt-container-width="true" data-small-header="true" data-hide-cover="true" data-show-facepile="false">
          <blockquote cite="https://www.facebook.com/mirrormediamg/" class="fb-xfbml-parse-ignore">
            <a href="https://www.facebook.com/mirrormediamg/">鏡週刊</a>
          </blockquote>
        </div>    
      </div>
      <div class="herbsapi">
        <div id="herbsapi" hb-width="100" hb-height="auto" hb-icon="https://mediafarmers.org/api/images/icon_2.png"></div>
        <div>喜歡這篇文章嗎？<br>歡迎灌溉支持喔！</div>
      </div>
      <div class="adsets">
        <slot name="ADE1"></slot>
      </div>
      <div class="google-recommendeds">
        <div class="title"><h3>推薦文章</h3></div>
        <div id="matchedContentContainer" class="matchedContentContainer"></div>
      </div>       
      <div class="facebook-comments" v-html="fbBlock"></div>
    </LazyItemWrapper>
  </div>
  <div v-else-if="articleStyle === 'photography'">
    <ArticleBodyPhotography :articleData="articleData" :viewport="verge.viewportW">
      <div class="facebook-comments" slot="slot_fb_comment" v-html="fbBlock"></div>
    </ArticleBodyPhotography>
  </div>
</template>
<script>
  import { SITE_URL, SOCIAL_LINK } from 'src/constants'
  import { find, get, map } from 'lodash'
  // import ArticleBody from 'src/components/article/ArticleBody.vue'
  // import ArticleBodyPhotography from 'src/components/article/ArticleBodyPhotography.vue'
  import Footer from 'src/components/Footer.vue'
  import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
  import Newsletter from 'src/components/Newsletter.vue'
  import RecommendList from 'src/components/article/RecommendList.vue'
  import verge from 'verge'

  const ArticleBody = () => import('src/components/article/ArticleBody.vue')
  const ArticleBodyPhotography = () => import('src/components/article/ArticleBodyPhotography.vue')

  export default {
    name: 'ArticleBodyContainer',
    components: {
      ArticleBody,
      ArticleBodyPhotography,
      Footer,
      LazyItemWrapper,
      Newsletter,
      RecommendList,
    },
    computed: {
      articleStyle () { return get(this.articleData, 'style', '') },
      articleUrl () { return `${SITE_URL}/story/${this.currArticleSlug}/` },
      currArticleSlug () { return get(this.$store, 'state.route.params.slug') },
      currArticleId () {
        return get(find(get(this.$store, 'state.articles.items'), { 'slug': get(this.$store, 'state.route.params.slug') }), 'id', '')
      },
      fbBlock () {
        return `<div class="fb-comments" data-href="${this.articleUrl}" data-numposts="5" data-width="100%" data-order-by="reverse_time"></div>`
      },
      isAd () { return get(this.articleData, 'isAdvertised', false) },
      recommendlist () {
        return get(this.$store, 'state.articlesRecommendList.relatedNews', [])
      },
      tags () {
        const tags = get(this.articleData, 'tags', [])
        return map(tags, t => (
          `<a href=\"/tag/${get(t, 'id', '')}\" id=\"tag-${get(t, 'id', '')}\">${get(t, 'name', '')}</a>`
        )).join('')
      },
    },
    data () {
      return {
        SOCIAL_LINK,
        verge
      }
    },
    methods: {
      get,
    },
    mounted () {
            
    },
    props: {
      articleData: {},
      dfpMode: {},
      sectionId: {},
      routeUpateReferrerSlug: {
        default: 'N/A'
      }
    }
  }
</script>
<style lang="stylus" scoped>
.article-container
  width 100%
  background-color #fff

  .article-heromedia
    max-width 100%

  .article-heromedia
    margin 30px auto 0
    background-color #fff
    position relative
  
  .article-tags
    margin-top 1.5em
    padding 0 20px
    > p
      margin 1em 0 .5em
      color #a0a0a0

    >>> .tags 
      display inline-block
      color rgba(2, 2, 2, 0.5)
      font-size 18px
      position relative

      a, a:hover, a:link, a:visited 
        display inline-block
        margin 0 .5em .6em 0
        padding .2em .4em
        color #fff
        text-decoration none
        background-color #c8c8c8
        border-bottom none
        cursor pointer

  .news-letter-label
    padding 0 20px
    margin-bottom 25px
    margin 25px auto
  .facebook-page
    margin-top 15px
    text-align center
    .fb-page, .fb-page span, .fb-page span iframe[style]
      width 100% !important  

  .adsets
    margin 25px auto
  .herbsapi
    display flex
    align-items center
    padding 15px
    margin 25px 0
    border-top 1px solid rgba(2,2,2,0.5)
    border-bottom 1px solid rgba(2,2,2,0.5)
    br
      display none
    
    #herbsapi
      height 40px
      margin-right 20px
      > a
        display inline-block
        padding 0
        font-size 0
        border none
  .facebook-comments, .google-recommendeds
    padding 0 20px
    margin 25px 0
    .title
      > h3
        font-size 1.5rem
  a, a:hover, a:link, a:visited
    display inline

</style>