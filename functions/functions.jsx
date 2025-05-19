import devices from '../../../constants/constants';

const isComponent = (type, component) => {
  const found = devices[type].components.find((d) => d.name === component);
  return found ? !found.isNotComponent : false;
};

const isComponentOptions = (type, component) => {
  const found = devices[type].components.find((d) => d.name === component);
  return found ? found.options : false;
};

const isComponentCapacity = (type, component) => {
  const found = devices[type].components.find((d) => d.name === component);
  return found ? found.capacity : false;
};

const isComponentOtherOptions = (type, component) => {
  const found = devices[type].components.find((d) => d.name === component);
  return found ? found.otherOptions : false;
};

const showType = (type, component) => {
  const found = devices[type].components.find((d) => d.name === component);
  return found ? found.type : '';
};

const showProperty = (type) => {
  const found = devices[type].components;
  return found ?? {};
};

const showOptions = (type, component) => {
  return devices[type].components
    .filter((d) => d.name === component)
    .map((d) => d.options)
    .flat();
};

const showOtherOptions = (type, component) => {
  return devices[type].components
    .filter((d) => d.name === component && d.otherOptions)
    .map((d) => d.otherOptions)
    .flat(); // pour aplatir les tableaux si otherOptions est un tableau
};

export {
  isComponent,
  isComponentOptions,
  showOptions,
  isComponentCapacity,
  isComponentOtherOptions,
  showOtherOptions,
  showType,
  showProperty,
};
