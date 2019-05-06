<template>
  <vue-dfp-provider
    :dfpUnits="dfpUnits"
    :dfpid="dfpid"
    :options="dfpOptions"
    :mode="dfpMode"
    :section="'other'">
    <template slot-scope="props" slot="dfpPos">
      <HeaderR :dfpHeaderLogoLoaded="dfpHeaderLogoLoaded" :props="props" :showDfpHeaderLogo="showDfpHeaderLogo" />
      <article-body-external :articleData="articleData" :dfpMode="dfpMode">
        <vue-dfp :is="props.vueDfp" pos="MBHD" class="dfp dfp--mobile center" :config="props.config" style="margin: 0 auto; padding: 20px 0;" slot="ADHD" :size="get($store, 'getters.adSize')"></vue-dfp>
        <vue-dfp :is="props.vueDfp" pos="MBE1" class="dfp dfp--mobile center" :config="props.config" slot="ADE1" :size="get($store, 'getters.adSize')" />
        <vue-dfp :is="props.vueDfp" pos="MBAR1" class="dfp dfp--mobile center" :config="props.config" slot="ADAR1" :size="get($store, 'getters.adSize')" />
        <vue-dfp :is="props.vueDfp" pos="MBAR2" class="dfp dfp--mobile center" :config="props.config" slot="ADAR2" :size="get($store, 'getters.adSize')" />
      </article-body-external>

      <div class="article-page-footer">
        <lazy-item-wrapper :position="verge.viewportH()" :strict="true">
          <vue-dfp :is="props.vueDfp" pos="MBFT" class="dfp dfp--mobile center" :config="props.config" :size="get($store, 'getters.adSize')" />
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
      <div class="fb-quote"></div>      
    </template>
  </vue-dfp-provider>
</template>
<script>
  import { FB_APP_ID, FB_PAGE_ID, DFP_ID, DFP_SIZE_MAPPING, DFP_UNITS, DFP_OPTIONS, SITE_DESCRIPTION, SITE_OGIMAGE, SITE_TITLE, SITE_TITLE_SHORT, SITE_URL, SECTION_WATCH_ID } from '../constants'
  import { MATCHED_CONTENT_AD_CLIENT, MATCHED_CONTENT_AD_SLOT } from 'src/constants'
  import { ScrollTriggerRegister } from 'src/util/scrollTriggerRegister'
  import { adtracker } from 'src/util/adtracking'
  import { currEnv, sendAdCoverGA, updateCookie } from 'src/util/comm'
  import { get, isEmpty } from 'lodash'
  import { getRole } from 'src/util/mmABRoleAssign'
  import ArticleBodyContainer from 'src/components/article/ArticleBodyContainer.vue'
  import ArticleBodyExternal from 'src/components/article/ArticleBodyExternal.vue'
  import Cookie from 'vue-cookie'
  import DfpCover from 'src/components/DfpCover.vue'
  import DfpFixed from 'src/components/DfpFixed.vue'
  import DfpST from 'src/components/DfpST.vue'
  import Footer from 'src/components/Footer.vue'
  import HeaderR from 'src/components/HeaderR.vue'
  import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
  import VueDfpProvider from 'plate-vue-dfp/DfpProvider.vue'
  import titleMetaMixin from 'src/util/mixinTitleMeta'
  import truncate from 'truncate'
  import verge from 'verge'
  const debug = require('debug')('CLIENT:External')
  const fetchData = (store, slug) => Promise.all([
    fetchSSRData(store),
    fetchPartners(store),
    fetchExternal(store, slug)
  ])

  const fetchEvent = (store, eventType = 'embedded') => {
    return store.dispatch('FETCH_EVENT', {
      params: {
        'max_results': 1,
        'where': {
          isFeatured: true,
          eventType: eventType
        }
      }
    })
  }

  const fetchExternal = (store, slug) => (
    store.dispatch('FETCH_EXTERNAL', {
      params: {
        where: {
          name: {
            $in: [ slug ]
          }
        }
      }
    })
  )

  const fetchPartners = store => {
    const page = get(store.state, 'partners.meta.page', 0) + 1
    return store.dispatch('FETCH_PARTNERS', {
      params: {
        max_results: 25,
        page: page
      }
    }).then(() => {
      if (get(store, 'state.partners.items.length') < get(store, 'state.partners.meta.total')) {
        fetchPartners(store)
      }
    })
  }

  const fetchPop = store => {
    return store.dispatch('FETCH_ARTICLES_POP_LIST', {})
  }

  const fetchSSRData = store => {
    return store.dispatch('FETCH_COMMONDATA', { 'endpoints': [ 'sections', 'topics' ] })
  }

  export default {
    name: 'External',
    asyncData ({ store, route: { params: { name }}}) {
      console.log('name', name)
      return fetchData(store, name)
    },  
    mixins: [ titleMetaMixin ],
    metaSet () {
      console.log('this.articleData.name', this.articleData.name)
      console.log('this.articleData', this.articleData)
      if (!this.articleData.name && process.env.VUE_ENV === 'server') {
        const e = new Error()
        e.massage = 'Page Not Found'
        e.code = '404'
        throw e
      }
      const { brief, name, partner, thumb } = this.articleData
      const title = `${get(this.articleData, 'title')} - ${SITE_TITLE_SHORT}`
      const category = get(partner, 'name', '')
      const ogDescription = truncate(brief, 197) || SITE_DESCRIPTION
      const imageUrl = thumb || SITE_OGIMAGE

      return {
        url: `${SITE_URL}/external/${name}/`,
        title: `${title} - ${SITE_TITLE_SHORT}`,
        meta: `
          <meta name="robots" content="index">
          <meta name="description" content="${ogDescription}">
          <meta name="section-name" content="externals">
          <meta name="category-name" content="${category}">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${ogDescription}">
          <meta name="twitter:image" content="${imageUrl}">
          <meta property="fb:app_id" content="${FB_APP_ID}">
          <meta property="fb:pages" content="${FB_PAGE_ID}">
          <meta property="og:site_name" content="${SITE_TITLE}">
          <meta property="og:locale" content="zh_TW">
          <meta property="og:type" content="article">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${ogDescription}">
          <meta property="og:url" content="${SITE_URL}/external/${name}/">
          <meta property="og:image" content="${imageUrl}">
        `
      }
    },  
    components: {
      'article-body-container': ArticleBodyContainer,
      'article-body-external': ArticleBodyExternal,
      'dfp-st': DfpST,
      'dfp-cover': DfpCover,
      'dfp-fixed': DfpFixed,
      'lazy-item-wrapper': LazyItemWrapper,
      'vue-dfp-provider': VueDfpProvider,
      Footer,
      HeaderR      
    },
    computed: {
      articleData () { return get(this.$store, `state.external.${this.currArticleSlug}`, {}) },
      currArticleSlug () { return get(this.$store, 'state.route.params.name') },
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
              // debug('Event "noad2" is detected!!')
              if (currentInstance.showDfpCoverAd2Flag && !currentInstance.showDfpCoverInnityFlag) {
                sendAdCoverGA('innity')
                // debug('noad2 detected and go innity')
                currentInstance.showDfpCoverInnityFlag = true
              }
            }
            window.addEventListener('noad2', loadInnityAd)
            window.parent.addEventListener('noad2', loadInnityAd)
            switch (position) {
              case 'MBCVR':
                sendAdCoverGA('dfp')
                if (adDisplayStatus === 'none') {
                  updateCookie().then((isVisited) => {
                    currentInstance.showDfpCoverAd2Flag = !isVisited
                  })
                } else {
                  updateCookie().then((isVisited) => {
                    currentInstance.showDfpCoverAdFlag = !isVisited
                  })
                }
                break
              case 'MBCVR2':
                debug('ad2 loaded')
                sendAdCoverGA('ad2')
                adDisplayStatus === 'none' && debug('dfp response no ad2')
                break
              case 'MBCVR3':
                // debug('adInnity loaded')
                sendAdCoverGA('innity')
                adDisplayStatus === 'none' && debug('dfp response no innity')
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
      isTimeToShowAdCover () { return get(this.$store, 'state.isTimeToShowAdCover', false) },
      sectionId () {
        const _sectionId = get(this.articleData, 'sections.0.id')
        return this.dfpUnits[ _sectionId ] ? _sectionId : 'other'
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
        showDfpHeaderLogo: false,
        showDfpCoverAdFlag: false,
        showDfpCoverAd2Flag: false,
        showDfpCoverInnityFlag: false,
        showDfpFixedBtn: false,
        verge
      }
    },
    methods: {
      closeDfpFixed () {
        this.showDfpFixedBtn = false
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
      get,
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
    beforeRouteUpdate (to, from, next) {
      fetchExternal(this.$store, to.params.slug)
      .then(() => {
        const thisItem = get(this.$store, `state.external.${to.params.name}`, {})
        const theComingArticleSlug = get(thisItem, 'name')

        if (!theComingArticleSlug) { location.replace('/404') }
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
      // this.abIndicator = this.getMmid()
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
      articleData () {
        if (!this.hasSentFirstEnterGA) {
          this.sendGA(this.articleData)
          this.hasSentFirstEnterGA = true
        }
      },      
    } 
  }
</script>
<style lang="stylus" scoped></style>