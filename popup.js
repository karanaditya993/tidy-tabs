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

        numBadge.className   = 'num-badge'        
        numBadge.innerText   = tab.tabIds.length
        numBadge.style.backgroundColor = getBadgeColor(tab.tabIds.length)

        // badgeEl.style.backgroundImage = `url(${tab.icon})`
        badgeEl.innerHTML = `<img src='${tab.icon}' height='30px' width='30px' />`
        badgeEl.style.backgroundRepeat = 'no-repeat'
        badgeEl.style.backgroundSize = 'cover'
        
        badgeEl.appendChild(numBadge)
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
      renderTabList()
    });

    icons[1].addEventListener('click', () => {
      icons[1].classList.add('active')
      icons[0].classList.remove('active')
      document.getElementById('grid-container').style.display = 'block'
      document.getElementById('list-container').style.display = 'none'
      renderTabList()
    });
  }

  // TO DO: needs more work - not reflecting until run in console (after loading) - trashing not working yet
  const listTabListener = () => {
    const tabRendered = document.querySelectorAll('div.tab')

    const listCloseListener = (el) => {
      const tabEl = el.target.closest('.tab')
      const tabIds = tabEl.dataset.tabIds.split(',').map(val => Number(val))
      chrome.tabs.remove(tabIds, () => {
        window.location.reload()
      })
    }

    tabRendered.forEach((domain) => {
      const badge = domain.querySelector('.tab-badge-icon')
      const numIds = badge.innerText
      domain.addEventListener('mouseenter', () => {
        badge.style.color = 'red'
        badge.innerHTML = `<i class="material-icons">close</i>`
      })

      domain.addEventListener('mouseleave', () => {
        badge.style.color = 'black'
        badge.innerText = numIds
      })

      domain.addEventListener('click', listCloseListener)
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
        gridTabCloseIcons = [...document.querySelectorAll('.tab')]
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
    toggleIconListeners()
    listCloseBtnListener()
    gridCloseListener()
    listTabListener()
  }

  window.onload = () => {
    addListeners()
    chrome.tabs.query({}, partitionTabs)
  }
})()
