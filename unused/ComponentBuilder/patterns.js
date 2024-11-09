// frontend/src/builders/ComponentBuilder/patterns.js
export const buildCompositeComponent = (composition, config) => {
    // Handle pattern components like SearchBar, FilterPanel, etc.
    const components = composition.map((componentType, index) => (
      <ComponentBuilder
        key={index}
        type={componentType}
        config={config}
      />
    ));
  
    return (
      <div className="composite-component">
        {components}
      </div>
    );
  };