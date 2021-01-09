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

  const renderTabList = () => {
    tabsData.map((tab, idx) => {
      if (document.getElementById('list-container').style.display !== 'none'
        && document.getElementsByClassName('list-tabs')[0].children.length !== tabsData.length
      ) {
        const tabsEl = document.getElementsByClassName('list-tabs')[0]
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
      } else if (document.getElementById('grid-container').style.display !== 'none'
        && document.getElementsByClassName('grid-tabs')[0].children.length !== tabsData.length
      ) {
        const tabsEl = document.getElementsByClassName('grid-tabs')[0]
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
      }
    })
  }

  const addListeners = () => {
    document.body.addEventListener('click', (el) => {
      if (el.target.id === 'switch-checkbox') {
        if (el.target.checked) {
          document.getElementById('grid-container').style.display = 'block'
          document.getElementById('list-container').style.display = 'none'
        } else {
          document.getElementById('grid-container').style.display = 'none'
          document.getElementById('list-container').style.display = 'block'
        }
        renderTabList()
      }

      if (document.getElementById('list-container')) {
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
      } else if (document.getElementById('grid-container')) {
        const tabEl = el.target.closest('.tab')
        const tabIds = tabEl.dataset.tabIds.split(',').map(val => Number(val))
        chrome.tabs.remove(tabIds, () => {
          window.location.reload()
        })
      }
    })
  }

  window.onload = () => {
    addListeners()
    chrome.tabs.query({}, partitionTabs)
  }
})()
