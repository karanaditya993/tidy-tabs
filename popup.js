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
    tabsData.map((tab, idx) => {
      let tabsEl
      let badgeEl       = document.createElement('div')
      let tabEl         = document.createElement('div')
      tabEl.className   = 'tab'
      badgeEl.className = 'tab-badge-icon'

      if (isOnListView()) {
        tabsEl            = document.getElementsByClassName('list-tabs')[0]
        const checkboxEl  = document.createElement('input')
        const favicon     = document.createElement('img')
        const label       = document.createElement('label')

        checkboxEl.name   = 'tab'
        checkboxEl.type   = 'checkbox'
        checkboxEl.id     = idx
        checkboxEl.value  = tab.url
        checkboxEl.dataset.tabIds = tab.tabIds.join(',')

        favicon.src       = tab.icon

        label.className   = 'tab-label'
        label.htmlFor     = checkboxEl.id
        label.innerHTML   = `<span class="tab-name">${tab.name}</span>`

        
        badgeEl.innerText = tab.tabIds.length
        badgeEl.style.backgroundColor = getBadgeColor(tab.tabIds.length)

        tabEl.appendChild(checkboxEl)
        tabEl.appendChild(favicon)
        tabEl.appendChild(label)
      } else if (isOnGridView()) {
        tabsEl               = document.getElementsByClassName('grid-tabs')[0]
        const numBadge       = document.createElement('div')
        const closeIcon      = document.createElement('div')

        tabEl.dataset.tabIds = tab.tabIds.join(',')
        
        closeIcon.className  = 'close-icon'

        numBadge.className   = 'num-badge'        
        numBadge.innerText   = tab.tabIds.length
        numBadge.style.backgroundColor = getBadgeColor(tab.tabIds.length)

        badgeEl.style.backgroundImage = `url(${tab.icon})`
        badgeEl.style.backgroundRepeat = 'no-repeat'
        badgeEl.style.backgroundSize = 'cover'
        
        badgeEl.appendChild(closeIcon)
        badgeEl.appendChild(numBadge)
      }
      tabEl && tabEl.appendChild(badgeEl)
      tabsEl && tabsEl.appendChild(tabEl)
    })
  }

  const switchCheckboxListener = () => {
    const switchCheckbox = document.getElementById('switch-checkbox')
    switchCheckbox.addEventListener('click', (el) => {
      if (el.target.checked) {
        // show grid view
        document.getElementById('grid-container').style.display = 'block'
        document.getElementById('list-container').style.display = 'none'
      } else {
        // show list view
        document.getElementById('grid-container').style.display = 'none'
        document.getElementById('list-container').style.display = 'block'
      }
      renderTabList()
    })
  }

  const listCloseBtnListener = () => {
    const listCloseBtn   = document.getElementById('close')
    listCloseBtn.addEventListener('click', () => {
      const checkedTabIds = [...document.querySelectorAll('input[name=tab]:checked')]
                                .map(box => box.dataset.tabIds.split(',')
                                .map(val => Number(val)))
                                .flat()
      chrome.tabs.remove(checkedTabIds, () => {
        window.location.reload()
      })
    })
  }

  const gridCloseListener = () => {
    let gridTabCloseIcons
    const gridTargetNode = document.getElementsByClassName('grid-tabs')[0]
    const gridObserver   = new MutationObserver(() => {
      if (!gridTabCloseIcons) {
        gridTabCloseIcons = [...document.querySelectorAll('.close-icon')]
        gridTabCloseIcons.map((icon) => {
          icon.addEventListener('click', (el) => {
            const tabEl = el.target.closest('.tab')
            const tabIds = tabEl.dataset.tabIds.split(',').map(val => Number(val))
            chrome.tabs.remove(tabIds, () => {
              gridObserver.disconnect()
              window.location.reload()
            })
          })
        })
      }
    })
    gridObserver.observe(gridTargetNode, { childList: true })
  }

  const addListeners = () => {
    switchCheckboxListener()
    listCloseBtnListener()
    gridCloseListener()
  }

  window.onload = () => {
    addListeners()
    chrome.tabs.query({}, partitionTabs)
  }
})()
