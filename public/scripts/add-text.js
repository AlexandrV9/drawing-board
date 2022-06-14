import {
  buttonText,
  textSettings,
  fontColorListWrapper
} from '../utils/constants.js'

const hideTextEditPanel = ({
  removeEvents, 
  changeObjectSelection
}) => {
  textSettings.style.left = '';
  textSettings.style.top = '';
  removeEvents();
  changeObjectSelection(true);
  buttonText.classList.remove('settings-panel__button_active');
  textSettings.classList.remove('text-settings_active');
  fontColorListWrapper.classList.remove('active');
}

export {
  hideTextEditPanel,
}