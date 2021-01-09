(()  => {
  const GET_DOMAIN_REGEX  = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img
  let tabsData            = []

  const getDomainFromUrl = (url) => {
    const a = document.createElement('a')
    a.className = 'delete'
    a.setAttribute('href', url);
    return a.hostname;
  }

  const partitionTabs = (tabs) => {
    tabs.map((tab) => {
      const matchedUrl = tab.url.match(GET_DOMAIN_REGEX)[0]
      const sameTab    = tabsData.find(t => t.url === matchedUrl)
      if (sameTab) {
        sameTab.tabIds.push(tab.id)
      } else {
        tabsData.push({
          icon: tab.favIconUrl,
          name: getDomainFromUrl(tab.url),
          tabIds: [tab.id],
          url: matchedUrl,
        })
      }
    })
    renderTabList(tabsData)
  }

  const getBadgeColor = (numTabs) => {
    let color
    const badgeColors = {
      success: {
        threshold: [1, 2],
        color: '#25a363'
      },
      warning: {
        threshold: [3, 5],
        color: '#f16f35'
      },
      danger: {
        threshold: [6, Infinity],
        color: '#bd3d44'
      }
    }

    Object.values(badgeColors).map(badge => {
      if (numTabs >= badge.threshold[0] && numTabs <= badge.threshold[1]) {
        color = badge.color
      }
    })
    return color
  }

  const renderTabList = (tabsData) => {
    const tabsEl = document.getElementsByClassName('tabs')[0]
    tabsData.map((tab) => {
      const badgeEl     = document.createElement('div')
      const numBadge    = document.createElement('div')
      const closeIcon   = document.createElement('div')
      const tabEl       = document.createElement('div')

      tabEl.className   = 'tab'
      tabEl.dataset.tabIds = tab.tabIds.join(',')
      closeIcon.className = 'close-icon'
      badgeEl.className = 'tab-badge-icon'
      badgeEl.style.backgroundImage = `url(${tab.icon})`
      badgeEl.style.backgroundRepeat = 'no-repeat'
      badgeEl.style.backgroundSize = 'cover'
      numBadge.className = 'num-badge'
      numBadge.style.backgroundColor = getBadgeColor(tab.tabIds.length)
      numBadge.innerText = tab.tabIds.length
      badgeEl.appendChild(closeIcon)
      badgeEl.appendChild(numBadge)
      tabEl.appendChild(badgeEl)
      tabsEl.appendChild(tabEl)
    })
  }

  const addListeners = () => {
    document.body.addEventListener('click', (el) => {
      const tabEl = el.target.closest('.tab')
      const tabIds = tabEl.dataset.tabIds.split(',').map(val => Number(val))
      chrome.tabs.remove(tabIds, () => {
        window.location.reload()
      })
    })
  }

  window.onload = () => {
    addListeners()
    chrome.tabs.query({}, partitionTabs)
  }
})()
