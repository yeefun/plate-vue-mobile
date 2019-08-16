<template>
  <vue-dfp-provider :dfpUnits="dfpUnits" :dfpid="dfpid" section="home" :options="dfpOptions" :mode="dfpMode" :key="`homepage`">
    <template slot-scope="props" slot="dfpPos">
      <div class="home-view">
        <section class="home-header">
          <Header :dfpHeaderLogoLoaded="dfpHeaderLogoLoaded" :props="props" :showDfpHeaderLogo="showDfpHeaderLogo" activeSection="home" />
        </section>
        <LazyItemWrapper :loadAfterPageLoaded="true">
          <vue-dfp :is="props.vueDfp" pos="LMBHD" :config="props.config" :size="get($store, 'getters.adSize')" />
        </LazyItemWrapper>
        <section class="home-mainContent">
          <editor-choice :editorChoice='editorChoice' :viewport="viewport" target="_blank" />
          <main>
            <LazyItemWrapper :loadAfterPageLoaded="true">
              <vue-dfp :is="props.vueDfp" pos="LMBL1" :config="props.config" :size="get($store, 'getters.adSize')"/>
            </LazyItemWrapper>
            <MirrorMediaTVAside v-if="hasEventEmbedded" :mediaData="eventMod" />
            <div class="aside-title" ref="aside_title"><h2 v-text="$t('homepage.focus')"></h2></div>
            <div class="focusNewsContainer" id="homepage-focus-news">
              <div class="focusNewsContainer__latest-mobile-b">
                <LatestArticleFocus
                  v-for="(o, i) in groupedArticle"
                  :key="`${i}-groupedlist-mobile-b`"
                  :groupedArticle="o" />
              </div>
            </div>
            <LazyItemWrapper :loadAfterPageLoaded="true">
              <vue-dfp :is="props.vueDfp" pos="LMBL2" :config="props.config" :size="get($store, 'getters.adSize')"/>
            </LazyItemWrapper>
            <LatestArticleMain id="latestArticle" target="_blank"
              :latestList="latestArticle"
              :viewport="viewport">
            </LatestArticleMain>
          </main>
        </section>
        <loading :show="loading" />
        <DfpCover v-show="showDfpCoverAdFlag">
          <vue-dfp :is="props.vueDfp" pos="LMBCVR" :config="props.config" slot="ad-cover" />
        </DfpCover>
        <DfpCover v-if="showDfpCoverAd2Flag" :showCloseBtn="false" class="raw">
          <vue-dfp :is="props.vueDfp" pos="LMBCVR2" :config="props.config" slot="ad-cover" />
        </DfpCover>
        <DfpCover v-if="showDfpCoverInnityFlag" :showCloseBtn="false" class="raw">
          <vue-dfp :is="props.vueDfp" pos="LMBCVR3" :config="props.config" slot="ad-cover" />
        </DfpCover>
      </div>
    </template>
  </vue-dfp-provider>
</template>

<script>
import { DFP_ID, DFP_UNITS, DFP_OPTIONS, DFP_SIZE_MAPPING, FB_APP_ID, FB_PAGE_ID } from 'src/constants'
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_OGIMAGE, SITE_TITLE, SITE_URL } from 'src/constants'
import { currentYPosition, elmYPosition } from 'kc-scroll'
import { currEnv, sendAdCoverGA, unLockJS, updateCookie } from 'src/util/comm'
import { getRole } from 'src/util/mmABRoleAssign'
import { adtracker } from 'src/util/adtracking'
import { concat, drop, dropRight, flatten, get, includes, map, remove, slice, take, union, unionBy, uniqBy } from 'lodash'
import Cookie from 'vue-cookie'
import DfpCover from 'src/components/DfpCover.vue'
import EditorChoice from 'src/components/EditorChoice.vue'
import Header from 'src/components/Header.vue'
import LatestArticleFocus from 'src/components/list/LatestArticleFocus.vue'
import LatestArticleMain from 'src/components/list/LatestArticleMain.vue'
import LazyItemWrapper from 'src/components/common/LazyItemWrapper.vue'
import LiveStream from 'src/components/LiveStream.vue'
import Loading from 'src/components/Loading.vue'
import MirrorMediaTVAside from 'src/components/MirrorMediaTVAside.vue'
import VueDfpProvider from 'plate-vue-dfp/DfpProvider.vue'
import moment from 'moment'
import titleMetaMixin from 'src/util/mixinTitleMeta'

const debug = require('debug')('CLIENT:Home')
const fetchSSRData = store => (
  store.dispatch('FETCH_COMMONDATA', { 'endpoints': [ 'sections' ] }).then(() => (
    Promise.all([
      fetchCommonData(store),
      fetchArticlesGroupedList(store),
      fetchPartners(store)
    ])
  ))
)

const fetchCommonData = store => store.dispatch('FETCH_COMMONDATA', { 'endpoints': [ 'posts-vue', 'projects', 'topics' ] })

const fetchEvent = (store, eventType = 'embedded') => (
  store.dispatch('FETCH_EVENT', {
    params: {
      'max_results': 1,
      'where': {
        isFeatured: true,
        eventType: eventType
      }
    }
  })
)

const fetchArticlesGroupedList = store => store.dispatch('FETCH_ARTICLES_GROUPED_LIST', { params: {}})

const fetchPartners = store => {
  const page = get(store, 'state.partners.meta.page', 0) + 1
  return store.dispatch('FETCH_PARTNERS', {
    params: {
      max_results: 25,
      page: page
    }
  }).then(() => {
    if (get(store, 'state.partners.items.length', 0) < get(store, 'state.partners.meta.total', 0)) {
      fetchPartners(store)
    }
  })
}

const MAXRESULT = 20
const PAGE = 1
const fetchLatestArticle = (store, page) => (
  store.dispatch('FETCH_LATESTARTICLES', {
    params: {
      'max_results': MAXRESULT,
      'page': page,
      'sort': '-publishedDate'
    }
  })
)

export default {
  name: 'home-view',
  components: {
    'editor-choice': EditorChoice,
    'live-stream': LiveStream,
    'loading': Loading,
    DfpCover,
    LatestArticleFocus,
    LatestArticleMain,
    LazyItemWrapper,
    MirrorMediaTVAside,
    VueDfpProvider,
    Header
  },
  asyncData ({ store }) {
    return fetchSSRData(store)
  },
  mixins: [ titleMetaMixin ],
  metaSet () {
    return {
      url: SITE_URL,
      title: SITE_TITLE,
      meta: `
        <meta name="robots" content="index">
        <meta name="keywords" content="${SITE_KEYWORDS}">
        <meta name="description" content="${SITE_DESCRIPTION}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${SITE_TITLE}">
        <meta name="twitter:description" content="${SITE_DESCRIPTION}">
        <meta name="twitter:image" content="${SITE_OGIMAGE}">
        <meta property="fb:app_id" content="${FB_APP_ID}">
        <meta property="fb:pages" content="${FB_PAGE_ID}">
        <meta property="og:site_name" content="${SITE_TITLE}">
        <meta property="og:locale" content="zh_TW">
        <meta property="og:type" content="article">
        <meta property="og:title" content="${SITE_TITLE}">
        <meta property="og:description" content="${SITE_DESCRIPTION}">
        <meta property="og:url" content="${SITE_URL}">
        <meta property="og:image" content="${SITE_OGIMAGE}">
      `
    }
  },
  data () {
    return {
      abIndicator: '',
      dfpid: DFP_ID,
      dfpHeaderLogoLoaded: false,
      dfpMode: 'prod',
      dfpUnits: DFP_UNITS,
      hasScrollLoadMore: get(this.$store, 'state.latestArticles.meta.page', PAGE) > 1,
      isVponSDKLoaded: false,
      loading: false,
      page: get(this.$store, 'state.latestArticles.meta.page', PAGE),
      showDfpCoverAdFlag: false,
      showDfpCoverAd2Flag: false,
      showDfpCoverInnityFlag: false,
      showDfpHeaderLogo: false,
      viewport: undefined,
    }
  },
  computed: {
    articlesGroupedList () { return this.$store.state.articlesGroupedList },
    commonData () { return this.$store.state.commonData },
    dfpOptions () {
      const currentInstance = this
      return Object.assign({}, DFP_OPTIONS, {
        afterEachAdLoaded: function (event) {
          const dfpCover = document.querySelector(`#${event.slot.getSlotElementId()}`)
          const position = dfpCover.getAttribute('pos')

          /**
           * Because googletag.pubads().addEventListener('slotRenderEnded', afterEachAdLoaded) can't be removed.
           * We have check if current page gets changed with checking by sessionId to prevent from runnig this outdated callback.
           */
          const elSessionId = dfpCover.getAttribute('sessionId')
          if (elSessionId !== this.sessionId) { return }

          const adDisplayStatus = dfpCover.currentStyle ? dfpCover.currentStyle.display : window.getComputedStyle(dfpCover, null).display
          const loadInnityAd = () => {
            debug('Event "noad2" is detected!!')
            if (currentInstance.showDfpCoverAd2Flag && !currentInstance.showDfpCoverInnityFlag) {
              sendAdCoverGA('innity')
              debug('noad2 detected and go innity')
              currentInstance.showDfpCoverInnityFlag = true
            }
          }
          window.addEventListener('noad2', loadInnityAd)
          window.parent.addEventListener('noad2', loadInnityAd)
          switch (position) {
            case 'LMBCVR':
              sendAdCoverGA('dfp')
              if (adDisplayStatus === 'none') {
                updateCookie({ currEnv: currentInstance.dfpMode }).then((isVisited) => {
                  currentInstance.showDfpCoverAd2Flag = !isVisited
                })
              } else {
                updateCookie({ currEnv: currentInstance.dfpMode }).then((isVisited) => {
                  currentInstance.showDfpCoverAdFlag = !isVisited
                })
              }
              break
            case 'LMBCVR2':
              debug('ad2 loaded')
              sendAdCoverGA('ad2')
              adDisplayStatus === 'none' && debug('dfp response no ad2')
              break
            case 'LMBCVR3':
              debug('adInnity loaded')
              sendAdCoverGA('innity')
              adDisplayStatus === 'none' && debug('dfp response no innity')
              break
            case 'LOGO':
              if (adDisplayStatus !== 'none') {
                currentInstance.showDfpHeaderLogo = true
              }
              currentInstance.dfpHeaderLogoLoaded = true
              break
          }
          adtracker({
            el: dfpCover,
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
    editorChoice () {
      const articles = get(this.articlesGroupedList, 'choices')
      return this.abIndicator === 'A' ? take(articles, 5) : articles
    },
    eventEmbedded () { return get(this.$store, 'state.eventEmbedded.items.0') },
    eventLogo () { return get(this.$store, 'state.eventLogo.items.0') },
    eventMod () { return get(this.$store, 'state.eventMod.items.0') },
    groupedArticle () { return slice(get(this.articlesGroupedList, 'grouped')) },
    hasEventEmbedded () {
      const _now = moment()
      const _eventStartTime = moment(new Date(get(this.eventEmbedded, 'startDate')))
      let _eventEndTime = moment(new Date(get(this.eventEmbedded, 'endDate')))
      if (_eventEndTime && (_eventEndTime < _eventStartTime)) {
        _eventEndTime = moment(new Date(get(this.eventEmbedded, 'endDate'))).add(12, 'h')
      }
      return (_eventStartTime && _eventEndTime && (_now >= _eventStartTime) && (_now <= _eventEndTime))
    },
    latestArticlesList () { return get(this.$store, 'state.latestArticles.items') },
    latestEndIndex () { return get(this.$store, 'state.articlesGroupedList.latestEndIndex') },
    latestArticle () {
      const { articlesGroupedList, latestEndIndex, latestArticlesList } = this
      const latestFirstPage = dropRight(get(articlesGroupedList, 'latest'), 3)
      const latestAfterFirstPage = drop(latestArticlesList, latestEndIndex)
      const choices = get(articlesGroupedList, 'choices')
      const groupedTitle = get(articlesGroupedList, 'grouped')
      const groupedRelateds = flatten(map(get(articlesGroupedList, 'grouped'), o => o.relateds))
      const grouped = union(groupedTitle, groupedRelateds)
      const choicesAndGrouped = unionBy(choices, grouped, 'slug')
      const choicesAndGrouped_slugs = choicesAndGrouped.map(o => o.slug)
      const latest = uniqBy(
        concat(latestFirstPage, latestAfterFirstPage),
        'slug'
      )
      remove(latest, o => includes(choicesAndGrouped_slugs, o.slug))
      return this.notFirstPageNow ? latest : latestFirstPage
    },
    notFirstPageNow () { return get(this.$store, 'state.latestArticles.meta.page', 1) !== 1 },
  },
  methods: {
    checkIfLockJS () {
      unLockJS()
    },
    get,
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
    initHasScrollLoadMore () {
      this.hasScrollLoadMore = false
    },
    updateViewport () {
      if (process.env.VUE_ENV === 'client') {
        this.viewport = document.documentElement.clientWidth || document.body.clientWidth
      }
    },
    updateSysStage () {
      this.dfpMode = currEnv()
    },
    loadMore () {
      window.ga('send', 'event', 'home', 'scroll', 'loadmore' + this.page, { location: document.location.href })
      this.page += 1
      this.loading = true

      fetchLatestArticle(this.$store, this.page).then(() => {
        this.hasScrollLoadMore = false
        this.loading = false
      })
    },
    handleScrollForLoadmore () {
      window.onscroll = () => {
        const _latestArticleDiv = document.querySelector('#latestArticle')
        if (!_latestArticleDiv) { return }
        const firstPageArticleHeight = _latestArticleDiv.offsetHeight
        const firstPageArticleBottom = elmYPosition('#latestArticle') + (firstPageArticleHeight)
        const currentBottom = currentYPosition() + window.innerHeight
        if ((currentBottom > (firstPageArticleBottom - 0)) && !this.hasScrollLoadMore) {
          this.hasScrollLoadMore = true
          this.loadMore()
        }
      }
    },
  },
  beforeMount () {
    this.abIndicator = this.getMmid()
    const jobs = [
      fetchEvent(this.$store, 'embedded'),
      fetchEvent(this.$store, 'logo'),
      fetchEvent(this.$store, 'mod'),
    ]
    Promise.all(jobs)
  },
  mounted () {
    this.handleScrollForLoadmore()
    this.updateViewport()
    window.addEventListener('resize', () => {
      this.updateViewport()
    })
    this.checkIfLockJS()
    this.updateSysStage()

    window.ga('set', 'contentGroup1', '')
    window.ga('set', 'contentGroup2', '')
    // window.ga('set', 'contentGroup3', '')
    window.ga('set', 'contentGroup3', `home${this.abIndicator}`)
    window.ga('send', 'pageview', { title: SITE_TITLE, location: document.location.href })
  },
  updated () {
    this.initHasScrollLoadMore()
    this.handleScrollForLoadmore()
    this.updateSysStage()
  },
  watch: {
    abIndicator: function () {
      this.$forceUpdate()
    }
  }
}

</script>
<style lang="stylus" scoped>
.home-header
  width 100%

.editorChoice
  margin-top 20px

.articleList-block
  display block

.home-view
  width 100%
  box-sizing border-box
  padding-bottom 50px 

  h2 
    margin: 0;
    font-family Noto Sans TC,sans-serif
    font-size 18px
    font-weight 700
    line-height 1.5
    letter-spacing .5px
    color rgba(0,0,0,.8)
    list-style-type none
    &.project-title--desktop
      display none
  .project-title--mobile
    padding 0 2em
    margin 10px 0
    h2
      font-size 1.5rem
      color #356d9c
      font-weight 400
      overflow hidden
      &::after
        content ""
        display inline-block
        height 0.5em
        vertical-align middle
        width 100%
        margin-right -100%
        margin-left 10px
        border-top 5px solid #356d9c
    
    
.list
  &.container
    width 100%

    .project-container
      margin 0 20px

    aside
      .aside-title
        // overflow hidden
        padding: 0 2rem
        margin-top 10px

        h2
          font-size 1.5rem
          color #356d9c
          font-weight 400
          overflow hidden
          margin-bottom 10px

          &::after
            content ""
            display inline-block
            height .5em
            vertical-align middle
            width 100%
            margin-right -100%
            margin-left 10px
            border-top 5px solid #356d9c

    main
      width 90%
      margin 0 auto

.home-mainContent
  width 100%
  flex-wrap wrap
  .latest-main-container
    width 90%
    margin 0 auto
  .project-container
    width 90%
    margin 0 auto
  .aside-title
    width 90%
    margin 10px auto 0

    h2
      font-size 1.5rem
      color #356d9c
      font-weight 400
      overflow hidden
      margin-bottom 10px

      &::after
        content ""
        display inline-block
        height .5em
        vertical-align middle
        width 100%
        margin-right -100%
        margin-left 10px
        border-top 5px solid #356d9c
  .latest-news
    margin-top 85px
    & + .latest-news
      margin-top 30px
section.footer
  width 100%

.projectListVert
  &.fixed
    position fixed
    top 20px
    right auto
    width calc(1024px * 0.25 - 30px)

.mmtv-aside
  &.fixed
    position fixed
    top 460px
    right auto
    width calc(1024px * 0.25 - 30px)

.focusNewsContainer
  &__latest-mobile-b
    width 90%
    margin 0 auto
    padding 14px 18px
    border solid 2px #224f73

@media (min-width: 600px)
  .list
    &.container
      width 100%
      padding 0 2rem

      // main

      .project-container
        margin 0

      aside
        display flex
        flex-wrap wrap
        justify-content space-between

        .aside-title
          width 100%
          color #356d9c
          margin-top 35px
          margin-bottom 10px
          // overflow hidden

          h2
            font-size 1.5rem
            color #356d9c

            &::after
              content ""
              display inline-block
              height .5em
              vertical-align middle
              width 100%
              margin-right -100%
              margin-left 10px
              border-top 5px solid #356d9c

      main
        width 100%

  .home-mainContent
    padding 0 2rem
    .aside-title
      width 100%
    .project-container
      width 100%
    .focusNewsContainer
      display flex
      flex-wrap wrap
      justify-content space-between
    .latest-main-container
      width 100%

  section.footer
    width 100%
    padding 0 2rem


</style>
