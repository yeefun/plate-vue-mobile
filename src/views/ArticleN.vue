<template>
  <vue-dfp-provider
    :dfpUnits="dfpUnits"
    :dfpid="dfpid"
    :section="sectionId"
    :options="dfpOptions"
    :mode="dfpMode">
    <template slot-scope="props" slot="dfpPos">
      <section class="article-page-header">
        <HeaderR :abIndicator="abIndicator" :activeSection="sectionName" :dfpHeaderLogoLoaded="dfpHeaderLogoLoaded" :props="props" :showDfpHeaderLogo="showDfpHeaderLogo" />
      </section>
      <ArticleBodyContainer
        :articleData="articleData"
        :dfpMode="dfpMode"
        :sectionId="sectionId"
        :routeUpateReferrerSlug="routeUpateReferrerSlug">
        <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="MBHD" extClass="full mobile-only" :config="props.config" slot="ADHD" />
        <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="PCE1" extClass="mobile-only" :config="props.config" slot="ADE1" />
        <!--vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised" pos="MBE1" extClass="mobile-only" :config="props.config" slot="ADE1"/-->
      </ArticleBodyContainer>
      <div class="article-page-footer">
        <LazyItemWrapper :position="verge.viewportH()" :strict="true">
          <vue-dfp :is="props.vueDfp" v-if="!hiddenAdvertised && dfpMode === 'dev' && sectionId === '596441d04bbe120f002a319a'" pos="MBFTOOP" :extClass="`full mobile-only ${styleDfpAd}`" :config="props.config" />
          <vue-dfp :is="props.vueDfp" v-else-if="!hiddenAdvertised" pos="MBFT" :extClass="`full mobile-only ${styleDfpAd}`" :config="props.config" />
        </LazyItemWrapper>
        <div class="footer">
          <Footer />
        </div>
      </div>

    </template>
  </vue-dfp-provider>
</template>
<script>
  import { DFP_ID, DFP_SIZE_MAPPING, DFP_UNITS, DFP_OPTIONS } from '../constants'
  import { adtracker } from 'src/util/adtracking'
  import { currEnv, sendAdCoverGA, updateCookie } from '../util/comm'
  import { find, get, } from 'lodash'
  import ArticleBodyContainer from 'src/components/article/ArticleBodyContainer.vue'
  import Footer from 'src/components/Footer.vue'
  import HeaderR from 'src/components/HeaderR.vue'
  import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
  import VueDfpProvider from 'plate-vue-dfp/DfpProvider.vue'
  import uuidv4 from 'uuid/v4'
  import verge from 'verge'

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

  const fetchData = async store => {    
    const [ article ] = await Promise.all([
      fetchArticles(store, store.state.route.params.slug),
      fetchSSRData(store),
      fetchPartners(store),
      fetchCommonData(store)
    ])
    const sectionId = get(article, 'items.0.sections.0.id')
    return fetchLatestArticle(store, {
      sort: '-publishedDate',
      where: { 'sections': sectionId }
    })
  }
  const fetchLatestArticle = (store, params) => store.dispatch('FETCH_LATESTARTICLE', { params: params })
  const fetchImages = (store, { ids = [], max_results = 10 }) => store.dispatch('FETCH_IMAGES_BY_ID', {
    ids,
    max_results
  })

  const debugDFP = require('debug')('CLIENT:Article')
  export default {
    name: 'Article',
    asyncData ({ store }) {
      return !process.browser ? fetchData(store) : Promise.resolve()
    },
    components: {
      'vue-dfp-provider': VueDfpProvider,
      ArticleBodyContainer,
      Footer,
      HeaderR,
      LazyItemWrapper,
    },
    computed: {
      articleData () { return find(get(this.$store, 'state.articles.items'), { 'slug': this.currArticleSlug }) || {} },
      currArticleSlug () { return get(this.$store, 'state.route.params.slug') },
      dfpOptions () {
        const currentInstance = this
        return Object.assign({}, DFP_OPTIONS, {
          sectionTempId: this.sectionTempId,
          afterEachAdLoaded: event => {
            const dfpCurrAd = document.querySelector(`#${event.slot.getSlotElementId()}`)
            const position = dfpCurrAd.getAttribute('pos')

            /**
             * Because googletag.pubads().addEventListener('slotRenderEnded', afterEachAdLoaded) can't be removed.
             * We have check if current page gets changed through sectionTempId. If so, dont run this outdated callback.
             */
            const sectionTempId = dfpCurrAd.getAttribute('sectionTempId')
            if (currentInstance.sectionTempId !== sectionTempId) { return }


            const adDisplayStatus = dfpCurrAd.currentStyle ? dfpCurrAd.currentStyle.display : window.getComputedStyle(dfpCurrAd, null).display
            const loadInnityAd = () => {
              debugDFP('Event "noad2" is detected!!')
              if (this.showDfpCoverAd2Flag && !this.showDfpCoverInnityFlag) {
                sendAdCoverGA('innity')
                debugDFP('noad2 detected and go innity')
                this.showDfpCoverInnityFlag = true
              }
            }
            window.addEventListener('noad2', loadInnityAd)
            window.parent.addEventListener('noad2', loadInnityAd)
            switch (position) {
              case 'MBCVR':
                sendAdCoverGA('dfp')
                debugDFP('MBCVR LOADED.')
                if (adDisplayStatus === 'none') {
                  updateCookie({ currEnv: this.dfpMode }).then(isVisited => {
                    this.showDfpCoverAd2Flag = !isVisited
                  })
                } else {
                  updateCookie({ currEnv: this.dfpMode }).then(isVisited => {
                    this.showDfpCoverAdFlag = !isVisited
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
                this.showDfpFixedBtn = !(adDisplayStatus === 'none')
                break
              case 'LOGO':
                if (adDisplayStatus !== 'none') {
                  this.showDfpHeaderLogo = true
                }
                this.dfpHeaderLogoLoaded = true
                break
            }
            adtracker({
              el: dfpCurrAd,
              slot: event.slot.getSlotElementId(),
              position,
              isAdEmpty: adDisplayStatus === 'none'
            }) 
          },
          setCentering: true,
          sizeMapping: DFP_SIZE_MAPPING
        })
      },
      hiddenAdvertised () {
        return get(this.articleData, 'hiddenAdvertised', false)
      },               
      sectionName () { return get(this.articleData, 'sections.0.name') },
      sectionId () {
        const _sectionId = get(this.articleData, 'sections.0.id')
        return this.dfpUnits[ _sectionId ] ? _sectionId : 'other'
      },
      styleDfpAd () { return (this.viewport < 321) ? 'ad-fit' : '' }
    },
    data () {
      return {
        abIndicator: '',
        dfpid: DFP_ID,
        dfpMode: 'prod',
        dfpUnits: DFP_UNITS,
        dfpHeaderLogoLoaded: false,
        lowPriorityDataLoader: false,
        routeUpateReferrerSlug: 'N/A',
        sectionTempId: `article-${uuidv4()}`,
        showDfpHeaderLogo: false,
        showDfpCoverInnityFlag: false,
        showDfpCoverAdFlag: false,
        showDfpCoverAd2Flag: false,
        showDfpFixedBtn: false,
        verge
      }
    },
    methods: {
      updateSysStage () {
        this.dfpMode = currEnv()
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
    mounted () {
      this.updateSysStage()
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
        })
       }
       window.addEventListener('scroll', lowPriorityDataLoader)      
    }
  }
</script>
<style lang="stylus" scoped>
.article-page-header
  width 100%
</style>