<template>
  <vue-dfp-provider
    :dfpUnits="dfpUnits"
    :dfpid="dfpid"
    :section="sectionId"
    :options="dfpOptions"
    :mode="dfpMode">
    <template slot-scope="props" slot="dfpPos">
      <section class="article-page-header" v-show="!isArticlePhotography">
        <HeaderR :abIndicator="abIndicator" :activeSection="sectionName" :dfpHeaderLogoLoaded="dfpHeaderLogoLoaded" :props="props" :showDfpHeaderLogo="showDfpHeaderLogo" />
      </section>
      <article-body-container
        :articleData="articleData"
        :dfpMode="dfpMode"
        :sectionId="sectionId"
        :routeUpateReferrerSlug="routeUpateReferrerSlug">
        <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="MBHD" extClass="full mobile-only" :config="props.config" slot="ADHD" />
        <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="MBE1" extClass="mobile-only" :config="props.config" slot="ADE1"/>
        <!--ADAR1 START-->
        <span id="innity-custom-adnetwork-span-63518" slot="ADAR1"></span>
        <span id="innity-custom-premium-span-12738" slot="ADAR1"></span>            
        <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="MBAR1" extClass="mobile-only" :config="props.config" slot="ADAR1" key="MBAR1" />
        <!--ADAR1 END-->
        <!--ADAR2 START-->
        <span id="innity-custom-adnetwork-span-68557" slot="ADAR2"></span>
        <span id="innity-custom-premium-span-12739" slot="ADAR2"></span>           
        <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="MBAR2" extClass="mobile-only" :config="props.config" slot="ADAR2" />
        <!--ADAR2 END-->
      </article-body-container>
      <div class="article-page-footer">
        <lazy-item-wrapper :position="verge.viewportH()" :strict="true">
          <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="MBFT" :extClass="'full mobile-only'" :config="props.config" />
        </lazy-item-wrapper>
        <div class="footer"><Footer /></div>
      </div>
      <dfp-st :props="props">
        <vue-dfp :is="props.vueDfp" :config="props.config" pos="MBST" slot="dfpST" />
      </dfp-st>
      <dfp-cover v-if="!hiddenAdvertised && isTimeToShowAdCover" v-show="showDfpCoverAdFlag"> 
        <vue-dfp :is="props.vueDfp" pos="MBCVR" :config="props.config" slot="ad-cover" /> 
      </dfp-cover> 
      <dfp-cover v-if="!hiddenAdvertised && showDfpCoverAd2Flag" :showCloseBtn="false" class="raw"> 
        <vue-dfp :is="props.vueDfp" pos="MBCVR2" :config="props.config" slot="ad-cover" /> 
      </dfp-cover>
      <dfp-cover v-if="!hiddenAdvertised && showDfpCoverInnityFlag" :showCloseBtn="false" class="raw">
        <vue-dfp :is="props.vueDfp" pos="MBCVR3" :config="props.config" slot="ad-cover" />
      </dfp-cover>      
      <dfp-fixed v-if="!hiddenAdvertised && hasDfpFixed" v-show="showDfpFixedBtn" v-on:closeDfpFixed="closeDfpFixed">
        <vue-dfp :is="props.vueDfp" pos="PCFF" slot="dfpFF" :config="props.config"/>
      </dfp-fixed>
      <AdultContentAlert v-if="isAdultContent" />
      <div class="fb-quote"></div>
    </template>
  </vue-dfp-provider>
</template>
<script>
  import { FB_APP_ID, FB_PAGE_ID, DFP_ID, DFP_SIZE_MAPPING, DFP_UNITS, DFP_OPTIONS, SITE_OGIMAGE, SITE_TITLE, SITE_TITLE_SHORT, SITE_MOBILE_URL, SITE_URL, SECTION_WATCH_ID } from '../constants'
  import { MATCHED_CONTENT_AD_CLIENT, MATCHED_CONTENT_AD_SLOT } from 'src/constants'
  import { ScrollTriggerRegister } from 'src/util/scrollTriggerRegister'
  import { adtracker } from 'src/util/adtracking'
  import { currEnv, lockJS, sendAdCoverGA, unLockJS, updateCookie } from 'src/util/comm'
  import { find, get, isEmpty, map } from 'lodash'
  import { getRole } from 'src/util/mmABRoleAssign'
  // import { updateJSONLDScript } from 'src/util/schemaOrg'
  import AdultContentAlert from 'src/components/AdultContentAlert.vue'
  import ArticleBodyContainer from 'src/components/article/ArticleBodyContainer.vue'
  import Cookie from 'vue-cookie'
  import DfpCover from 'src/components/DfpCover.vue'
  import DfpFixed from 'src/components/DfpFixed.vue'
  import DfpST from 'src/components/DfpST.vue'
  import Footer from 'src/components/Footer.vue'
  import HeaderR from 'src/components/HeaderR.vue'
  import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
  import VueDfpProvider from 'plate-vue-dfp/DfpProvider.vue'
  import sanitizeHtml from 'sanitize-html'
  import truncate from 'truncate'
  import titleMetaMixin from 'src/util/mixinTitleMeta'
  import verge from 'verge'

  const debugDFP = require('debug')('CLIENT:DFP')
  const fetchArticles = (store, slug) => store.dispatch('FETCH_ARTICLES', {
    params: {
      clean: 'content',
      where: {
        'slug': { '$in': [ slug ] }
      }
    },
    preview: get(store, 'state.route.query.preview')
  })

  const fetchEvent = (store, eventType = 'embedded') => store.dispatch('FETCH_EVENT', {
    params: {
      'max_results': 1,
      'where': {
        isFeatured: true,
        eventType: eventType
      }
    }
  })

  const fetchPartners = store => {
    const page = get(store.state, 'partners.meta.page', 0) + 1
    return store.dispatch('FETCH_PARTNERS', {
      params: {
        max_results: 25,
        page: page
      }
    }).then(() => {
      get(store.state, 'partners.items.length') < get(store.state, 'partners.meta.total')
        && fetchPartners(store)
    })
  }

  const fetchPop = store => store.dispatch('FETCH_ARTICLES_POP_LIST', {})
  const fetchSSRData = store => store.dispatch('FETCH_COMMONDATA', { 'endpoints': [ 'sections', 'topics' ] })
  const fetchCommonData = store => store.dispatch('FETCH_COMMONDATA', { 'endpoints': [ 'projects' ] })

  const fetchData = async store => Promise.all([
    fetchArticles(store, store.state.route.params.slug),
    fetchSSRData(store),
    fetchPartners(store),
    fetchCommonData(store)
  ])

  const fetchImages = (store, { ids = [], max_results = 10 }) => store.dispatch('FETCH_IMAGES_BY_ID', {
    ids,
    max_results
  })

  export default {
    name: 'Article',
    preFetch: fetchData,
    asyncData ({ store }) {
      return !process.browser ? fetchData(store) : Promise.resolve()
    },
    components: {
      'article-body-container': ArticleBodyContainer,
      'dfp-st': DfpST,
      'dfp-cover': DfpCover,
      'dfp-fixed': DfpFixed,
      'lazy-item-wrapper': LazyItemWrapper,
      'vue-dfp-provider': VueDfpProvider,
      AdultContentAlert,
      Footer,
      HeaderR
    },
    computed: {
      articleData () { return find(get(this.$store, 'state.articles.items'), { 'slug': this.currArticleSlug }) || {} },
      currArticleSlug () { return get(this.$store, 'state.route.params.slug') },
      dfpOptions () {
        const currentInstance = this
        return Object.assign({}, DFP_OPTIONS, {
          afterEachAdLoaded: function (event) {
            const dfpCurrAd = document.querySelector(`#${event.slot.getSlotElementId()}`)
            const position = dfpCurrAd.getAttribute('pos')

            /**
            * Because googletag.pubads().addEventListener('slotRenderEnded', afterEachAdLoaded) can't be removed.
            * We have check if current page gets changed with checking by sessionId to prevent from runnig this outdated callback.
            */
            const elSessionId = dfpCurrAd.getAttribute('sessionId')
            if (elSessionId !== this.sessionId) { return }


            const adDisplayStatus = dfpCurrAd.currentStyle ? dfpCurrAd.currentStyle.display : window.getComputedStyle(dfpCurrAd, null).display
            const loadInnityAd = () => {
              debugDFP('Event "noad2" is detected!!')
              if (currentInstance.showDfpCoverAd2Flag && !currentInstance.showDfpCoverInnityFlag) {
                sendAdCoverGA('innity')
                debugDFP('noad2 detected and go innity')
                currentInstance.showDfpCoverInnityFlag = true
              }
            }
            window.addEventListener('noad2', loadInnityAd)
            window.parent.addEventListener('noad2', loadInnityAd)
            switch (position) {
              case 'MBCVR':
                sendAdCoverGA('dfp')
                debugDFP('MBCVR LOADED.')
                if (adDisplayStatus === 'none') {
                  updateCookie({ currEnv: currentInstance.dfpMode }).then(isVisited => {
                    currentInstance.showDfpCoverAd2Flag = !isVisited
                  })
                } else {
                  updateCookie({ currEnv: currentInstance.dfpMode }).then(isVisited => {
                    currentInstance.showDfpCoverAdFlag = !isVisited
                  })
                }
                break
              case 'MBCVR2':
                debugDFP('ad2 loaded')
                sendAdCoverGA('ad2')
                adDisplayStatus === 'none' &&  debugDFP('dfp response no ad2')
                break
              case 'MBCVR3':
                debugDFP('adInnity loaded')
                sendAdCoverGA('innity')
                adDisplayStatus === 'none' && debugDFP('dfp response no innity')
                break                
              case 'PCFF':
                currentInstance.showDfpFixedBtn = !(adDisplayStatus === 'none')
                break
              case 'LOGO':
                if (adDisplayStatus !== 'none') {
                  currentInstance.showDfpHeaderLogo = true
                }
                currentInstance.dfpHeaderLogoLoaded = true
                break
              default:
                debugDFP(`AD ${position} LOADED!`)
            }
            adtracker({
              el: dfpCurrAd,
              slot: event.slot.getSlotElementId(),
              position,
              isAdEmpty: adDisplayStatus === 'none',
              sessionId: elSessionId
            }) 
          },
          setCentering: true,
          sizeMapping: DFP_SIZE_MAPPING
        })
      },  
      fbAppId () { return get(this.$store, 'state.fbAppId') },      
      hasDfpFixed () { return this.sectionId === SECTION_WATCH_ID },   
      hiddenAdvertised () { return get(this.articleData, 'hiddenAdvertised', false) },   
      isAdultContent () {
        return get(this.articleData, 'isAdult', false)
      },
      isArticlePhotography () {
        return get(this.articleData, 'style', '') === 'photography'
      },    
      isLockJS () {
        return get(this.articleData, 'lockJS')
      },    
      isTimeToShowAdCover () { return get(this.$store, 'state.isTimeToShowAdCover', false) },
      sectionName () { return get(this.articleData, 'sections.0.name') },
      sectionId () {
        const _sectionId = get(this.articleData, 'sections.0.id')
        return this.dfpUnits[ _sectionId ] ? _sectionId : 'other'
      },
      sendGA (articleData) {
        if (get(articleData, 'sections.length') === 0) {
          window.ga('set', 'contentGroup1', '')
          window.ga('set', 'contentGroup2', '')
          // window.ga('set', 'contentGroup3', '')
          window.ga('set', 'contentGroup3', `article${this.abIndicator}`)
        } else {
          window.ga('set', 'contentGroup1', `${get(articleData, 'sections.0.name')}`)
          window.ga('set', 'contentGroup2', `${get(articleData, 'categories.0.name')}`)
          // window.ga('set', 'contentGroup3', '')
          window.ga('set', 'contentGroup3', `article${this.abIndicator}`)
        }
        window.ga('send', 'pageview', { title: `${get(articleData, 'title', '')} - ${SITE_TITLE_SHORT}`, location: document.location.href })
      },
    },
    data () {
      return {
        abIndicator: '',
        dfpid: DFP_ID,
        dfpMode: 'prod',
        dfpUnits: DFP_UNITS,
        dfpHeaderLogoLoaded: false,
        hasSentFirstEnterGA: false,
        lowPriorityDataLoader: false,
        routeUpateReferrerSlug: 'N/A',
        showDfpHeaderLogo: false,
        showDfpCoverInnityFlag: false,
        showDfpCoverAdFlag: false,
        showDfpCoverAd2Flag: false,
        showDfpFixedBtn: false,
        verge
      }
    },
    methods: {  
      closeDfpFixed () {
        this.showDfpFixedBtn = false
      }, 
      getMmid () {
        const mmid = Cookie.get('mmid')
        let assisgnedRole = get(this.$route, 'query.ab')
        if (assisgnedRole) {
          assisgnedRole = assisgnedRole.toUpperCase()
        }
        const role = getRole({ mmid, distribution: [
          { id: 'A', weight: 50 },
          { id: 'B', weight: 50 } ]
        })
        return assisgnedRole || role
      },   
      initializeFBComments () {
        if (window.FB) {
          window.FB && window.FB.init({
            appId: this.fbAppId,
            xfbml: true,
            version: 'v2.0'
          })
          window.FB && window.FB.XFBML.parse()
        }
      },      
      insertMatchedContentScript () {
        const matchedContentStart = document.createElement('script')
        const matchedContentContent = document.createElement('ins')
        const matchedContentEnd = document.createElement('script')
        matchedContentStart.setAttribute('id', 'matchedContentStart')
        matchedContentStart.setAttribute('async', 'true')
        matchedContentStart.setAttribute('src', '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')
        matchedContentContent.setAttribute('id', 'matchedContentContent')
        matchedContentContent.setAttribute('class', 'adsbygoogle')
        matchedContentContent.setAttribute('style', 'display:block')
        matchedContentContent.setAttribute('data-ad-format', 'autorelaxed')
        matchedContentContent.setAttribute('data-ad-client', MATCHED_CONTENT_AD_CLIENT)
        matchedContentContent.setAttribute('data-ad-slot', MATCHED_CONTENT_AD_SLOT)
        matchedContentEnd.setAttribute('id', 'matchedContentEnd')
        matchedContentEnd.innerHTML = `(adsbygoogle = window.adsbygoogle || []).push({});`

        /**/
        /* photography article may not have this container */
        const container = document.querySelector('#matchedContentContainer')
        /**/

        if (!document.querySelector('#matchedContentStart')) {
          container && container.appendChild(matchedContentStart)
        }
        if (!document.querySelector('#matchedContentContent')) {
          container && container.appendChild(matchedContentContent)
        }
        if (!document.querySelector('#matchedContentEnd')) {
          container && container.appendChild(matchedContentEnd)
        }
      },
      insertMediafarmersScript () {
        const mediafarmersScript = document.createElement('script')
        mediafarmersScript.setAttribute('id', 'mediafarmersJS')
        mediafarmersScript.setAttribute('src', 'https://mediafarmers.org/api/api.js')
        if (!document.getElementById('mediafarmersJS')) {
          document.querySelector('body').appendChild(mediafarmersScript)
        }
      },           
      updateSysStage () {
        this.dfpMode = currEnv()
      },
    },
    mixins: [ titleMetaMixin ],
    metaSet () {
      if (!this.articleData.slug && process.env.VUE_ENV === 'server') {
        const e = new Error()
        e.massage = 'Page Not Found'
        e.code = '404'
        throw e
      }
      const {
        adTrace = '',
        brief = {},
        categories = {},
        heroImage = {},
        isAdult = false,
        ogDescription = '',
        ogImage = {},
        ogTitle = '',
        sections = {},
        slug = '',
        tags = {},
        title = '',
        topics = {}
      } = this.articleData
      const categorieName = get(categories, 'name', '')
      const imageUrl = get(heroImage, 'image.resizedTargets.mobile.url', '')
      const robotsValue = isAdult ? 'noindex' : 'index'
      const ogImageUrl = get(ogImage, 'image.resizedTargets.mobile.url', '')
      const pureBrief = truncate(sanitizeHtml(map(get(brief, 'apiData', []), o => map(get(o, 'content', []), str => str)).join(''), { allowedTags: [] }), 197)
      const pureTags = map(tags, t => get(t, 'name', ''))
      const sectionName = get(sections, '0.name', '')
      const topicId = get(topics, '_id', '')

      return {
        url: `${SITE_MOBILE_URL}/story/${slug}/`,
        title: title,
        meta: `
          <meta name="robots" content="${robotsValue}">
          <meta name="keywords" content="${get(categories, 'title') + ',' + pureTags.toString()}">
          <meta name="description" content="${pureBrief}">
          <meta name="section-name" content="${sectionName}">
          <meta name="category-name" content="${categorieName}">
          <meta name="topic-id" content="${topicId}">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${ogTitle.length > 0 ? ogTitle : title}">
          <meta name="twitter:description" content="${ogDescription.length > 0 ? truncate(ogDescription, 197) : pureBrief}">
          <meta name="twitter:image" content="${ogImageUrl.length > 0 ? ogImageUrl : ((imageUrl.length > 0) ? imageUrl : SITE_OGIMAGE)}">
          <meta property="fb:app_id" content="${FB_APP_ID}">
          <meta property="fb:pages" content="${FB_PAGE_ID}">
          <meta property="og:site_name" content="${SITE_TITLE}">
          <meta property="og:locale" content="zh_TW">
          <meta property="og:type" content="article">
          <meta property="og:title" content="${ogTitle.length > 0 ? ogTitle : title}">
          <meta property="og:description" content="${ogDescription.length > 0 ? truncate(ogDescription, 197) : pureBrief}">
          <meta property="og:url" content="${SITE_URL}/story/${slug}/">
          <meta property="og:image" content="${ogImageUrl.length > 0 ? ogImageUrl : (imageUrl.length > 0 ? imageUrl : SITE_OGIMAGE)}">
        `, // <meta name="mm-opt" content="article${abIndicator}">
        link: `<link rel="amphtml" href="${SITE_URL}/story/amp/${slug}/">`,
        adTrace: adTrace
      }
    },
    beforeRouteUpdate (to, from, next) {
      fetchArticles(this.$store, to.params.slug)
      .then(() => {
        const thisItem = find(get(this.$store, 'state.articles.items'), { 'slug': to.params.slug })
        const theComingArticleSlug = get(thisItem, 'slug')

        if (!theComingArticleSlug) { location.replace('/404') }
        this.routeUpateReferrerSlug = get(from, 'params.slug', 'N/A')
        return
      })
      .then(() => next())
    },
    beforeRouteLeave (to, from, next) {
      if (process.env.VUE_ENV === 'client') {
        const mediafarmersScript = document.querySelector('#mediafarmersJS')
        if (mediafarmersScript) {
          document.querySelector('body').removeChild(mediafarmersScript)
        }
      }
      next()
    },    
    mounted () {
      this.updateSysStage()
      this.abIndicator = this.getMmid()
      const scrollTriggerRegister = new ScrollTriggerRegister([
        { target: '#matchedContentContainer', offset: 400, cb: this.insertMatchedContentScript },
        { target: '#matchedContentContainer', offset: 400, cb: this.initializeFBComments }
      ])
      scrollTriggerRegister.init()

      if (isEmpty(this.articleData)) {
        this.sendGA(this.articleData)
        this.hasSentFirstEnterGA = true
      }

      /**
       * Data's supposed to be loaded later.
       */
      const lowPriorityDataLoader = () => {
        if (this.isLowPriorityDataLoaded) { return }        
        this.isLowPriorityDataLoaded = true
        if (this.articleData.relateds && this.articleData.relateds.length > 0) {
          const relatedImages = this.articleData.relateds.filter(related => related).map(related => related.heroImage)
          fetchImages(this.$store, { ids: relatedImages, max_results: relatedImages.length  })
        }        
        Promise.all([
          fetchPop(this.$store),
          fetchEvent(this.$store, 'embedded'),
          fetchEvent(this.$store, 'logo'),
        ]).then(() => {
          window.removeEventListener('scroll', lowPriorityDataLoader)
          this.insertMediafarmersScript()
        })
       }
       window.addEventListener('scroll', lowPriorityDataLoader)      
    },
    updated () {
      this.updateSysStage()
    },
    watch: {
      '$route.fullPath': function () {
        this.initializeFBComments()
        this.updateMatchedContentScript()
        this.updateMediafarmersScript()
        this.sendGA(this.articleData)
      },
      articleData (value) {
        if (!this.hasSentFirstEnterGA) {
          this.sendGA(this.articleData)
          this.hasSentFirstEnterGA = true
        }
        if (value.relateds && value.relateds.length > 0) {
          const relatedImages = value.relateds.filter(related => related).map(related => related.heroImage)
          fetchImages(this.$store, { ids: relatedImages, max_results: relatedImages.length  })
        }

        /**
         * Check out ref: https://support.google.com/webmasters/answer/3069489?hl=zh-Hant
         * But is it supposed be server-side rendered?
         */
        // updateJSONLDScript({
        //   article: this.articleData,
        //   route: get(this.$route, 'path '),
        //   heroImage: get(this.articleData, 'heroImage') || { image: {}, }
        // })
      },
      isLockJS () {
        this.isLockJS ? lockJS() : unLockJS()
      }
    },
  }
</script>
<style lang="stylus" scoped>
.article-page-header
  width 100%
</style>