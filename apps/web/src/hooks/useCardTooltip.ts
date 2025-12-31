import * as React from "react";

function useCardTooltip(cardRef: React.RefObject<HTMLDivElement | null>) {
  const [placement, setPlacement] = React.useState<'left' | 'right'>('right');
  const [isHovered, setIsHovered] = React.useState(false);

  const updatePlacement = React.useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const cardCenterX = rect.left + rect.width / 2;
    setPlacement(cardCenterX < windowWidth / 2 ? 'right' : 'left');
  }, [cardRef]);

  React.useEffect(() => {
    updatePlacement();
  }, [updatePlacement]);

  React.useEffect(() => {
    if (!isHovered) return;

    const handleScroll = () => {
      updatePlacement();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHovered, updatePlacement]);

  return {
    placement,
    isHovered,
    handleMouseEnter: () => {
      setIsHovered(true);
      updatePlacement();
    },
    handleMouseLeave: () => setIsHovered(false),
  };
}

export { useCardTooltip };
