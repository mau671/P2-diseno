import * as React from "react";

type UseAnimatedScrollOptions = {
  axis?: "x" | "y";
  duration?: number;
  amountFactor?: number;
};

type UseAnimatedScrollReturn = {
  scrollRef: React.RefCallback<HTMLDivElement>;
  scrollElement: HTMLDivElement | null;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  updateScrollButtons: () => void;
};

/**
 * Hook for animated horizontal or vertical scrolling with manual navigation buttons.
 * Reusable across Characters, Recommendations, and other horizontal/vertical carousels.
 */
export function useAnimatedScroll(
  options: UseAnimatedScrollOptions = {}
): UseAnimatedScrollReturn {
  const {
    axis = "x",
    duration = 400,
    amountFactor = 0.6,
  } = options;

  // Use state to store the element so we can react to changes
  const [scrollElement, setScrollElement] = React.useState<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  // Callback ref - this gets called whenever the element is assigned or removed
  const scrollRef = React.useCallback((node: HTMLDivElement | null) => {
    setScrollElement(node);
  }, []);

  const updateScrollButtons = React.useCallback(() => {
    if (!scrollElement) return;

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } =
      scrollElement;

    if (axis === "x") {
      setCanScrollPrev(scrollLeft > 0);
      setCanScrollNext(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    } else {
      setCanScrollPrev(scrollTop > 0);
      setCanScrollNext(Math.ceil(scrollTop + clientHeight) < scrollHeight);
    }
  }, [axis, scrollElement]);

  // Set up scroll listener and initial check when element changes
  React.useEffect(() => {
    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", updateScrollButtons, { passive: true });

    // Use requestAnimationFrame to ensure the element is fully laid out
    requestAnimationFrame(() => {
      updateScrollButtons();
    });

    return () => {
      scrollElement.removeEventListener("scroll", updateScrollButtons);
    };
  }, [scrollElement, updateScrollButtons]);

  const scroll = React.useCallback(
    (direction: "prev" | "next") => {
      if (!scrollElement) return;

      const container = scrollElement;
      const scrollAmount =
        axis === "x"
          ? container.clientWidth * amountFactor
          : container.clientHeight * amountFactor;

      const startScroll = axis === "x" ? container.scrollLeft : container.scrollTop;
      const targetScroll =
        direction === "prev"
          ? startScroll - scrollAmount
          : startScroll + scrollAmount;

      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        if (scrollElement) {
          const currentScroll = startScroll + (targetScroll - startScroll) * ease;

          if (axis === "x") {
            scrollElement.scrollLeft = currentScroll;
          } else {
            scrollElement.scrollTop = currentScroll;
          }

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        }
      };

      requestAnimationFrame(animateScroll);
    },
    [axis, amountFactor, duration, scrollElement]
  );

  const scrollPrev = React.useCallback(() => scroll("prev"), [scroll]);
  const scrollNext = React.useCallback(() => scroll("next"), [scroll]);

  return {
    scrollRef,
    scrollElement,
    scrollPrev,
    scrollNext,
    canScrollPrev,
    canScrollNext,
    updateScrollButtons,
  };
}

