<template>
  <div class="article-body-container" :class="{ 'article-container': articleStyle !== 'photography' }">
    <LazyItemWrapper :loadAfterPageLoaded="true"><slot name="ADHD"></slot></LazyItemWrapper>
    <ArticleBodyN :articleData="articleData" />
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
    <div class="adsets"><slot name="ADE1"></slot></div>
    <PopList :pop="popularlist" v-if="isPoplistActive" :currEnv="dfpMode">
      <MicroAd v-for="(a, i) in get(microAds, 'article')"
        class="pop_item margin-top-0"
        :currEnv="dfpMode" :currUrl="articleUrl"
        :id="`${get(a, 'pcId')}`"
        :key="`${get(a, 'pcId')}`"
        :slot="`microAd${i}`" />
    </PopList>     
    <div class="facebook-comments"></div>

        <!--div class="article" v-if="articleData">
          <article-body
            :articleData="articleData"
            :isAd="isAd"
            :poplistData="popularlist"
            :projlistData="projectlist"
            :viewport="viewport">
          
            <LazyItemWrapper :position="verge.viewportH()" slot="dfpad-AR1" :strict="true">
              <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised && dfpMode === 'dev' && sectionId === '596441604bbe120f002a3197'" pos="PCAROOP" extClass="mobile-hide" :config="props.config" />
              <vue-dfp :is="props.vueDfp" v-else-if="!hiddenAdvertised" pos="PCAR" extClass="mobile-hide" :config="props.config"  />
              <template>
                <span id="innity-custom-adnetwork-span-63518"></span>
                <span id="innity-custom-premium-span-12738"></span>            
              </template>
              <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="MBAR1" extClass="mobile-only" :config="props.config"/>
            </LazyItemWrapper>
            <LazyItemWrapper :position="verge.viewportH()" slot="dfpad-AR2" :strict="true">
              <template>
                <span id="innity-custom-adnetwork-span-68557"></span>
                <span id="innity-custom-premium-span-12739"></span>           
              </template>
              <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="MBAR2" extClass="mobile-only" :config="props.config"/>
            </LazyItemWrapper>
       
            <div class="article_fb_comment" style="margin: 1.5em 0;" slot="slot_fb_comment" v-html="fbCommentDiv"></div>
            <template v-if="!hiddenAdvertised" slot="recommendList">
              <div><h3>推薦文章</h3></div>
              <div id="matchedContentContainer" class="matchedContentContainer"></div>
            </template>
          </article-body>
        </div-->
  </div>
</template>
<script>
  import { SECTION_MAP, SITE_URL, SOCIAL_LINK } from 'src/constants'
  import { find, get, map } from 'lodash'
  import { microAds } from 'src/constants/microAds'
  import ArticleBodyN from 'src/components/article/ArticleBodyN.vue'
  import Footer from 'src/components/Footer.vue'
  import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
  import Newsletter from 'src/components/Newsletter.vue'
  import MicroAd from 'src/components/MicroAd.vue'
  import RecommendList from 'src/components/article/RecommendList.vue'
  import PopList from 'src/components/article/PopList.vue'

  export default {
    name: 'ArticleBodyContainer',
    components: {
      ArticleBodyN,
      Footer,
      LazyItemWrapper,
      Newsletter,
      MicroAd,
      PopList,
      RecommendList,
    },
    computed: {
      articleStyle () { return get(this.articleData, 'style', '') },
      articleUrl () { return `${SITE_URL}/story/${this.currArticleSlug}/` },
      currArticleSlug () { return get(this.$store, 'state.route.params.slug') },
      currArticleId () {
        return get(find(get(this.$store, 'state.articles.items'), { 'slug': get(this.$store, 'state.route.params.slug') }), 'id', '')
      },
      isAd () { return get(this.articleData, 'isAdvertised', false) },
      isPoplistActive () {
        return get(SECTION_MAP, `${this.sectionId}.isShowPoplist`, true)
      },
      popularlist () {
        return get(this.$store, 'state.articlesPopList.report', [])
      },
      recommendlist () {
        // return get(this.$store, 'state.articlesRecommendList.relatedNews', [])
        const items = get(this.articleData, 'relateds', []) || []
        return items.filter(item => item)
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
        microAds
      }
    },
    methods: {
      get
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

  .facebook-page
    display none
    margin-top 15px
    .fb-page, .fb-page span, .fb-page span iframe[style]
      width 100% !important  

  .herbsapi
    display flex
    align-items center
    padding 15px 0
    margin 15px 0
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
  a, a:hover, a:link, a:visited
    display inline

</style>