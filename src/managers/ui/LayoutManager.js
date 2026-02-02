/**
 * @file src/managers/ui/LayoutManager.js
 * @description Handles the dynamic repositioning and resizing of the player HUD.
 */
export class LayoutManager {
  constructor(deps) {
    this.state = deps.state;
    this.ui = deps.ui;
    this.showToast = deps.showToast;
    this.selectedItem = null;
    this.initialPinchDistance = 0;
    this.resizingElement = null;
  }

  init() {
    this.loadLayout();
    this.addEventListeners();
  }

  /**
   * Toggles the editor overlay and saves progress on close.
   */
  toggleEditMode() {
    this.state.ui.isLayoutEditMode = !this.state.ui.isLayoutEditMode;
    const container = document.getElementById('layout-container');
    
    if (container) {
      container.classList.toggle('layout-edit-mode', this.state.ui.isLayoutEditMode);
    }

    if (!this.state.ui.isLayoutEditMode) {
      if (this.selectedItem) {
        this.selectedItem.classList.remove('layout-selected');
        this.selectedItem = null;
      }
      this.saveLayout();
      this.showToast('Layout Saved!');
    } else {
      this.showTutorial();
      this.showToast('Layout Edit: Tap to select, tap again to swap.');
    }
  }

  addEventListeners() {
    const container = document.getElementById('layout-container');
    if (!container) return;

    container.addEventListener('click', e => this.handleTap(e));
    container.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: false });
    container.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
    container.addEventListener('touchend', e => this.handleTouchEnd(e));
  }

  handleTap(e) {
    if (!this.state.ui.isLayoutEditMode) return;

    const tappedTab = e.target.closest('.tappable-tab');
    if (tappedTab) {
      e.preventDefault();
      e.stopPropagation();
      this.processSelection(tappedTab, 'tab');
      return;
    }

    const tappedSection = e.target.closest('.tappable-section');
    if (tappedSection) {
      this.processSelection(tappedSection, 'section');
    }
  }

  processSelection(element, type) {
    if (!this.selectedItem) {
      this.selectedItem = element;
      element.classList.add('layout-selected');
    } else {
      if (this.selectedItem === element) {
        element.classList.remove('layout-selected');
        this.selectedItem = null;
      } else if (this.selectedItem.classList.contains(`tappable-${type}`) && element.classList.contains(`tappable-${type}`)) {
        const parent = element.parentNode;
        const selectedNext = this.selectedItem.nextSibling;
        parent.insertBefore(this.selectedItem, element);
        parent.insertBefore(element, selectedNext);
        this.selectedItem.classList.remove('layout-selected');
        this.selectedItem = null;
      } else {
        this.selectedItem.classList.remove('layout-selected');
        this.selectedItem = element;
        element.classList.add('layout-selected');
      }
    }
  }

  handleTouchStart(e) {
    if (!this.state.ui.isLayoutEditMode || e.touches.length !== 2) return;

    this.resizingElement = e.target.closest('.tappable-section');
    if (!this.resizingElement) return;

    e.preventDefault();
    this.initialPinchDistance = this.getPinchDistance(e.touches);
    this.resizingElement.style.transition = 'none';
  }

  handleTouchMove(e) {
    if (!this.state.ui.isLayoutEditMode || e.touches.length !== 2 || !this.resizingElement) return;

    e.preventDefault();
    const newPinchDistance = this.getPinchDistance(e.touches);
    const scale = newPinchDistance / this.initialPinchDistance;
    let newHeight = this.resizingElement.offsetHeight * scale;

    const minHeight = 80;
    const maxHeight = (this.ui.layoutContainer?.offsetHeight || window.innerHeight) * 0.7;
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    this.resizingElement.style.flexBasis = `${newHeight}px`;
    this.resizingElement.style.flexGrow = '0';
    this.resizingElement.style.flexShrink = '0';

    this.initialPinchDistance = newPinchDistance;
  }

  handleTouchEnd() {
    if (this.resizingElement) {
      this.resizingElement.style.transition = '';
      this.resizingElement = null;
      this.initialPinchDistance = 0;
    }
  }

  getPinchDistance(touches) {
    return Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
  }

  saveLayout() {
    const layoutData = {
      sections: [],
      tabs: [...document.querySelectorAll('.tappable-tab')].map(el => el.dataset.tab)
    };

    document.querySelectorAll('.tappable-section').forEach(el => {
      layoutData.sections.push({ id: el.id, size: el.style.flexBasis || null });
    });

    localStorage.setItem('geminusLayout', JSON.stringify(layoutData));
  }

  loadLayout() {
    const savedLayout = JSON.parse(localStorage.getItem('geminusLayout'));
    if (!savedLayout) return;

    const sectionContainer = document.getElementById('layout-container');
    if (!sectionContainer) return;
    
    const sectionMap = new Map([...sectionContainer.children].map(child => [child.id, child]));

    savedLayout.sections.forEach(sectionData => {
      const el = sectionMap.get(sectionData.id);
      if (el) {
        sectionContainer.appendChild(el);
        if (sectionData.size) {
          el.style.flexBasis = sectionData.size;
          el.style.flexGrow = '0';
          el.style.flexShrink = '0';
        }
      }
    });

    const tabContainer = document.getElementById('main-tabs-container');
    if (tabContainer) {
      savedLayout.tabs.forEach(tab => {
        const el = tabContainer.querySelector(`[data-tab="${tab}"]`);
        if (el) tabContainer.appendChild(el);
      });
    }
  }

  showTutorial() {
    if (localStorage.getItem('geminusEditorTutorialSeen') || !this.ui.layoutContainer) return;

    const tutorialHTML = `
      <div id="editor-tutorial-overlay" class="absolute inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 text-center text-white" style="border-radius: 0.5rem;">
        <div class="backdrop-blur-sm p-6 rounded-lg glass-panel">
          <h3 class="font-orbitron text-2xl mb-4 text-glow-label">Layout Editor Guide</h3>
          <p class="mb-2">Tap a section, then tap another to <strong class="text-[var(--highlight-color)]">swap</strong>.</p>
          <p>Use a two-finger <strong class="text-[var(--highlight-color)]">pinch gesture</strong> to resize.</p>
          <button id="close-tutorial-btn" class="glass-button px-6 py-2 mt-6">Got It</button>
        </div>
      </div>`;

    this.ui.layoutContainer.insertAdjacentHTML('beforeend', tutorialHTML);

    const closeTutorial = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const overlay = document.getElementById('editor-tutorial-overlay');
      if (overlay) overlay.remove();
      localStorage.setItem('geminusEditorTutorialSeen', 'true');
    };

    const closeBtn = document.getElementById('close-tutorial-btn');
    if (closeBtn) {
      closeBtn.addEventListener('touchend', closeTutorial, { once: true });
      closeBtn.addEventListener('click', closeTutorial, { once: true });
    }
  }
}