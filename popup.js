(()  => {
  const closeBtn          = document.getElementById('close')
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
    tabsData.map((tab, idx) => {
      const badgeEl     = document.createElement('div')
      const checkboxEl  = document.createElement('input')
      const favicon     = document.createElement('img')
      const label       = document.createElement('label')
      const tabEl       = document.createElement('div')

      tabEl.className   = 'tab'
      checkboxEl.name   = 'tab'
      checkboxEl.type   = 'checkbox'
      checkboxEl.id     = idx
      checkboxEl.value  = tab.url
      checkboxEl.dataset.tabIds = tab.tabIds.join(',')
      favicon.src       = tab.icon
      label.className   = 'tab-label'
      label.htmlFor     = checkboxEl.id
      label.innerHTML   = `<span class="tab-name">${tab.name}</span>`
      badgeEl.className = 'tab-badge'
      badgeEl.innerText = tab.tabIds.length
      badgeEl.style.backgroundColor = getBadgeColor(tab.tabIds.length)
      tabEl.appendChild(checkboxEl)
      tabEl.appendChild(favicon)
      tabEl.appendChild(label)
      tabEl.appendChild(badgeEl)
      tabsEl.appendChild(tabEl)
    })
  }

  const addListeners = () => {
    document.body.addEventListener('click', (el) => {
      if (el.target.className === 'tab') {
        const input = el.target.querySelector('input')
        input.checked = !input.checked
        return
      }
      if (el.target.id === 'close') {
        const checkedTabIds = [...document.querySelectorAll('input[name=tab]:checked')]
                              .map(box => box.dataset.tabIds.split(',')
                              .map(val => Number(val)))
                              .flat()
        chrome.tabs.remove(checkedTabIds, () => {
          window.location.reload()
        })
        return
      }
    })
  }

  window.onload = () => {
    addListeners()
    chrome.tabs.query({}, partitionTabs)
  }
})()
