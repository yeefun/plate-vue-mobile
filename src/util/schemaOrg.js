import { SITE_TITLE, SITE_URL, SITE_DESCRIPTION } from 'src/constants'
import { get, map } from 'lodash'

const genJsonLDNewsArticle = ({
  article,
  route,
  heroImage
}) => {
  return `{ "@context": "http://schema.org", "@type": "NewsArticle", "headline": "${get(article, 'title')}",
    "url": "${SITE_URL + route}", "thumbnailUrl": "${get(heroImage, 'image.resizedTargets.desktop.url')}",
    "articleSection": "${get(article, 'sections.0.title')}",
    "keywords": [ ${map(get(article, 'tags'), t => (`${get(t, 'name')}`))} ],
    "mainEntityOfPage": { "@type": "WebPage", "@id": "${SITE_URL + route}" },
    "image": { "@type": "ImageObject", "url": "${get(heroImage, 'image.resizedTargets.desktop.url')}", "height": ${get(heroImage, 'image.resizedTargets.desktop.height')}, "width": ${get(this.heroImage, 'image.resizedTargets.desktop.width')} },
    "datePublished": "${get(article, [ 'publishedDate' ])}", "dateModified": "${get(article, 'updatedAt')}", "author": { "@type": "Person", "name": "${get(article, 'writers.0.name')}" },
    "publisher": { "@type": "Organization", "name": "${SITE_TITLE}", "logo": { "@type": "ImageObject", "url": "https://www.mirrormedia.mg/assets/images/logo.png" } },
    "description": "${get(article, 'brief.apiData.0.content.0')}"
  }`
}

const genJsonLDPerson = article => {
  return `{ "@context": "http://schema.org", "@type": "Person", "name": "${get(article, 'writers.name')}",
    "url": "${SITE_URL + '/author/' + get(article, 'writers.0.id')}",
    "brand": { "@type": "Brand", "name": "${SITE_TITLE}", "url": "${SITE_URL}", "image": "https://www.mirrormedia.mg/assets/mirrormedia/logo.svg", "logo": "https://www.mirrormedia.mg/assets/mirrormedia/logo.svg", "description": "${SITE_DESCRIPTION}" }
  }`
}
      
const genJsonLDBreadcrumbList = ({
  article,
  route
}) => {
  return `{ "@context": "http://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "item": { "@id": "${SITE_URL}", "name": "${SITE_TITLE}" } },
      { "@type": "ListItem", "position": 2, "item": { "@id": "${SITE_URL + '/section/' + get(article, 'sections.0.name')}", "name": "${get(article, 'sections.0.title')}" } },
      { "@type": "ListItem", "position": 3, "item": { "@id": "${SITE_URL + route}", "name": "${get(article, 'title')}" } }
    ]
  }`
}

const insertJSONLDScript = ({
  article,
  route,
  heroImage
}) => {
  const newsArticleScript = document.createElement('script')
  const personScript = document.createElement('script')
  const breadcrumbScript = document.createElement('script')
  newsArticleScript.setAttribute('id', 'js-newsArticle')
  newsArticleScript.setAttribute('type', 'application/ld+json')
  newsArticleScript.innerHTML = genJsonLDNewsArticle({ article, route, heroImage })
  personScript.setAttribute('id', 'js-person')
  personScript.setAttribute('type', 'application/ld+json')
  personScript.innerHTML = genJsonLDPerson(article)
  breadcrumbScript.setAttribute('id', 'js-breadcrumb')
  breadcrumbScript.setAttribute('type', 'application/ld+json')
  breadcrumbScript.innerHTML = genJsonLDBreadcrumbList({ article, route })
  if (!document.getElementById('js-newsArticle')) {
    document.querySelector('head').appendChild(newsArticleScript)
  }
  if (!document.getElementById('js-person')) {
    document.querySelector('head').appendChild(personScript)
  }
  if (!document.getElementById('js-breadcrumb')) {
    document.querySelector('head').appendChild(breadcrumbScript)
  }
}

export const updateJSONLDScript = ({
  article,
  route,
  heroImage
}) => {
  const newsArticleScript = document.querySelector('#js-newsArticle')
  const personScript = document.querySelector('#js-person')
  const breadcrumbScript = document.querySelector('#js-breadcrumb')
  if (newsArticleScript) {
    document.querySelector('head').removeChild(newsArticleScript)
    document.querySelector('head').removeChild(personScript)
    document.querySelector('head').removeChild(breadcrumbScript)
  }
  insertJSONLDScript({
    article,
    route,
    heroImage
  })
}