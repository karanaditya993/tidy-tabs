(()  => {
  const GET_DOMAIN_REGEX  = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img
  let tabsData            = []
  let experienceType

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
    tabsData = tabsData.sort((tab1, tab2) => tab2.tabIds.length - tab1.tabIds.length)
    renderTabList(tabsData)
  }

  const getBadgeColor = (numTabs) => {
    let color
    const badgeColors = {
      low: {
        threshold: [1, 1],
        color: '#e6e6e6' 
      },
      few: {
        threshold: [2, 2],
        color: '#d3d3d3' 
      },
      couple: {
        threshold: [3, 3],
        color: '#c3c3c4'
      },
      many: {
        threshold: [4, Infinity],
        color: '#b2b2b3'
      }
    }

    Object.values(badgeColors).map(badge => {
      if (numTabs >= badge.threshold[0] && numTabs <= badge.threshold[1]) {
        color = badge.color
      }
    })
    return color
  }

  const isOnListView = () => (
    document.getElementById('list-container').style.display !== 'none'
    && document.getElementsByClassName('list-tabs')[0].children.length !== tabsData.length
  )

  const isOnGridView = () => (
    document.getElementById('grid-container').style.display !== 'none'
        && document.getElementsByClassName('grid-tabs')[0].children.length !== tabsData.length
  )

  const renderTabList = () => {
    tabsData.map((tab) => {
      let tabsEl
      let badgeEl       = document.createElement('div')
      let tabEl         = document.createElement('div')
      tabEl.className   = 'tab'
      badgeEl.className = 'tab-badge-icon'
      const favicon        = document.createElement('img')

      favicon.src       = tab.icon
      favicon.className = 'tab-icon'
      favicon.onerror   = () => {
        favicon.src        = 'assets/images/chrome-logo.png'
      }

      if (isOnListView()) {
        tabsEl            = document.getElementsByClassName('list-tabs')[0]
        const label       = document.createElement('div')

        tabEl.dataset.tabIds = tab.tabIds.join(',')

        label.className   = 'tab-label'
        label.innerHTML   = `<span class="tab-name">${tab.name}</span>`

        badgeEl.innerHTML = `<span class="badge-text">${tab.tabIds.length}</span> <i class="close-tab material-icons">close</i>`
        badgeEl.style.backgroundColor = getBadgeColor(tab.tabIds.length)

        tabEl.appendChild(favicon)
        tabEl.appendChild(label)
      } else if (isOnGridView()) {
        tabsEl               = document.getElementsByClassName('grid-tabs')[0]

        tabEl.dataset.tabIds = tab.tabIds.join(',')

        badgeEl.className = 'num-badge'
        badgeEl.innerHTML = `<span class="badge-text">${tab.tabIds.length}</span> <i class="close-tab material-icons">close</i>`
        badgeEl.style.backgroundColor = getBadgeColor(tab.tabIds.length)

        tabEl.style.backgroundRepeat = 'no-repeat'
        tabEl.style.backgroundSize = 'cover'
        
        tabEl.appendChild(favicon)
        tabEl.appendChild(badgeEl)
      }
      tabEl && tabEl.appendChild(badgeEl)
      tabsEl && tabsEl.appendChild(tabEl)
    })
  }

  const toggleIconListeners = () => {
    const icons = document.querySelectorAll('.material-icons')
    icons[0].addEventListener('click', () => {
      icons[0].classList.add('active')
      icons[1].classList.remove('active')
      document.getElementById('grid-container').style.display = 'none'
      document.getElementById('list-container').style.display = 'block'
      // addExperienceType('list')
      renderTabList()
    });

    icons[1].addEventListener('click', () => {
      icons[1].classList.add('active')
      icons[0].classList.remove('active')
      document.getElementById('grid-container').style.display = 'block'
      document.getElementById('list-container').style.display = 'none'
      // addExperienceType('grid')
      renderTabList()
    });
  }

  const addMutationListener = (containerSelector) => {
    let tabCloseIcons
    const targetNode = document.getElementsByClassName(containerSelector)[0]
    const observer   = new MutationObserver(() => {
      if (!tabCloseIcons) {
        tabCloseIcons = [...document.querySelectorAll('.tab')]
        tabCloseIcons.map((icon) => {
          icon.addEventListener('click', (el) => {
            const tabEl = el.target.closest('.tab')
            const tabIds = tabEl.dataset.tabIds.split(',').map(val => Number(val))
            chrome.tabs.remove(tabIds, () => {
              observer.disconnect()
              window.location.href = `${window.location.href}?experience_type=${experienceType}`
            })
          })
        })
      }
    })
    observer.observe(targetNode, { childList: true })
  }

  const addListeners = () => {
    toggleIconListeners()
    addMutationListener('list-tabs')
    addMutationListener('grid-tabs')
  }

  // const addExperienceType = (experienceType) => {
  //   const url = new URL(window.location.href)
  //   const experience = url.searchParams.experience_type || experienceType || 'list'
  //   url.searchParams.set('experience_type', experience)
  //   window.location.replace(url.href);
  // }

  window.onload = () => {
    // addExperienceType()
    addListeners()
    chrome.tabs.query({}, partitionTabs)
  }
})()
