<template>
  <article class="articleBodyExternal">
    <slot name="ADHD"></slot>
    <div class="articleBodyExternal__heroImage">
      <LazyImage :src="heroImage" />
    </div>
    <div class="article__info">
      <div class="article__info--section">健康醫療</div>
      <div class="article__info--date" v-text="date"></div>
    </div>
    <div class="article__title"><h1 v-text="title"></h1></div>
    <div v-if="credit" class="article__credit">文｜<span v-html="credit"></span></div>
    <main>
      <section class="article__main">
        <p class="article__main--brief" v-text="brief"></p>
        <template v-if="contentWithHtmlTag">
          <div class="article__main--content" v-html="content" id="article-body-content">
          </div>
        </template>
        <template v-else>
          <div class="article__main--content" id="article-body-content">
            <template v-for="(p, index) in content">
              <p :key="`content-${index}`" v-html="p"></p>
              <slot v-if="index === 1" name="ADAR1"></slot>
              <slot v-if="index === 4" name="ADAR2"></slot>
            </template>
          </div>
        </template>
        <p v-if="source" class="article__main--ref">【<strong>本文經</strong><span v-text="partner"></span><strong>授權轉載</strong><a :href="source" target="_blank">看原文</a>】</p>
      </section>
    </main>
    <LazyItemWrapper :position="verge.viewportH()">
      <Newsletter />
      <p class="news-letter-label">更多內容，歡迎<a :href="socialLink.SUBSCRIBE" target="_blank">訂閱鏡週刊</a></p>
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
        <div><h3>推薦文章</h3></div>
        <div id="matchedContentContainer" class="matchedContentContainer"></div>
      </div>    
      <PopList :pop="popularlist" v-if="isPoplistActive" :currEnv="dfpMode">
        <MicroAd v-for="(a, i) in get(microAds, 'article')"
          class="pop_item margin-top-0"
          :currEnv="dfpMode" :currUrl="articleUrl"
          :id="`${get(a, 'pcId')}`"
          :key="`${get(a, 'pcId')}`"
          :slot="`microAd${i}`" />
      </PopList>
      <div class="facebook-comments" v-html="fbBlock"></div>
     </LazyItemWrapper> 
  </article>
</template>

<script>
  import { SECTION_MAP, SITE_URL, SOCIAL_LINK } from 'src/constants'
  import { get, map, split, uniq } from 'lodash'
  import { microAds } from 'src/constants/microAds'
  import MicroAd from 'src/components/MicroAd.vue'
  import Newsletter from 'src/components/Newsletter.vue'
  import LazyImage from 'src/components/common/LazyImage.vue'
  import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
  import PopList from 'src/components/article/PopList.vue'
  import moment from 'moment'
  import verge from 'verge'

  export default {
    name: 'ArticleBodyExternal',
    components: {
      LazyImage,
      LazyItemWrapper,
      MicroAd,
      Newsletter,
      PopList
    },
    data () {
      return {
        microAds,
        verge
      }
    },
    props: {
      articleData: {
        type: Object,
        required: true
      },
      dfpMode: {},
    },
    computed: {
      articleUrl () { return `${SITE_URL}/external/${this.currArticleSlug}/` },      
      brief () {
        return get(this.articleData, 'brief')
      },
      content () {
        const orig = get(this.articleData, 'content')
        if (this.contentWithHtmlTag) {
          return orig
        }
        return split(orig, `\r\n\r\n`)
      },
      contentWithHtmlTag () {
        const orig = get(this.articleData, 'content')
        return orig.includes('<p>')
      },
      credit () {
        const author = uniq(split(get(this.articleData, 'extendByline'), ','))
        return map(author, a => a).join('、')
      },
      currArticleSlug () { return this.$store.state.route.params.name },
      date () {
        const { publishedDate = '' } = this.articleData
        const normalizedDt = new Date(publishedDate)
        const datetime = moment(normalizedDt).format('YYYY.MM.DD HH:mm')
        return datetime
      },
      fbBlock () {
        return `<div class="fb-comments" data-href="${this.articleUrl}" data-numposts="5" data-width="100%" data-order-by="reverse_time"></div>`
      },
      heroImage () {
        const link = get(this.articleData, 'thumb')
        if (link) {
          return link
        }
        return
      },
      isPoplistActive () {
        return get(SECTION_MAP, 'other.isShowPoplist', true)
      },
      partner () {
        return get(this.articleData, 'partner.display')
      },
      popularlist () {
        return get(this.$store, 'state.articlesPopList.report', [])
      },
      socialLink () {
        return SOCIAL_LINK
      },
      source () {
        return get(this.articleData, 'source')
      },
      title () {
        return get(this.articleData, 'title')
      }
    },
    methods: {
      get,
    }
  }
</script>

<style lang="stylus">

.articleBodyExternal
  width 100%
  font-family "Noto Sans TC", STHeitiTC-Light, "Microsoft JhengHei", sans-serif
  max-width 100%

  main
    position relative

  &__heroImage
    width 100%
    font-size 0
    text-align center
    margin-top 20px
    img 
      width 100%
  
  h1
    margin 15px 0
    font-size 2.2rem
    font-weight 400
    text-align justify
  
  .article
    &__credit
      text-align center  
    &__info
      display flex
      justify-content space-between
      align-items flex-end
      &--section
        padding-left 10px
        font-size 1.3rem
        border-left 7px solid #ee5a24
      &--date
        color #a1a1a1
        font-size 1rem
        font-style italic
        font-weight normal
    &__info, &__title, &__main
      padding 30px 25px 0     
    &__main
      margin-top 30px
      line-height 36px
      a, a:hover, a:link, a:visited
        padding-bottom 5px
        color #3195b3
        text-decoration none
        border-bottom 1px solid #3195b3
        cursor pointer
      &--brief
        color #08639e
        text-align justify
        font-weight bold
        font-size 1.2rem
        line-height 36px
      &--content
        p
          font-weight 400
        h2
          margin-top 40px
          color #000
          font-weight bolder
        p
          margin 1.5em 0
          color #171717
          font-size 18px
          line-height 36px
          text-align justify
        img 
          width 100%
        .picture-box
          p
            margin 10px 0
            color rgba(0,0,0,0.498)
            font-size 15px
            line-height 1.7
            letter-spacing 0.3px
      &--ref
        font-size 18px
        font-weight 700
        strong
          color #FF0000
        a, a:hover, a:link, a:visited
          padding 0
          margin-left .8em
          color #171717
          border none
    h3
      font-size 26px
  .news-letter-label
    padding 0 25px
  .herbsapi
    display flex
    align-items center
    padding 15px 25px
    margin 15px 0
    border-top 1px solid rgba(2,2,2,0.5)
    border-bottom 1px solid rgba(2,2,2,0.5)
    br
      display none
  .facebook-page, .facebook-comments, .google-recommendeds
    width 100%
    margin-top 15px
    padding 0 25px

  #herbsapi
    height 40px
    margin-right 20px
    > a
      display inline-block
      padding 0
      font-size 0
      border none 
  a, a:hover, a:link, a:visited
    padding-bottom 5px
    color #3195b3
    text-decoration none
    border-bottom 1px solid #3195b3
    cursor pointer
@media (min-width 500px)
  .articleBodyExternal
    padding 30px 50px 0

@media (min-width 768px)
  .articleBodyExternal
    width 645px
    padding 50px 0 0
    margin 0 auto
</style>