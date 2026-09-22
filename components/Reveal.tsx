"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Props = {
  children: React.ReactNode;
  className?: string;
  /**
   * Stagger the element's direct children instead of moving the whole block.
   * Use for grids and lists.
   */
  stagger?: boolean;
  /** Seconds to wait before starting. */
  delay?: number;
};

/**
 * Reveals its contents once, as they scroll into view.
 *
 * Deliberately small: 14px of travel and a short fade. Long slides and blur
 * are what make a page feel generated rather than designed.
 */
export default function Reveal({
  children,
  className,
  stagger = false,
  delay = 0,
}: Props) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(node, { opacity: 1 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      // In stagger mode the wrapper itself must be visible, otherwise hiding
      // it would hide the children this is about to animate.
      const targets = stagger
        ? gsap.utils.toArray<HTMLElement>(node.children)
        : [node];

      if (stagger) gsap.set(node, { opacity: 1 });
      gsap.set(targets, { opacity: 0, y: 14 });

      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        delay,
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: node,
          start: "top 88%",
          once: true,
        },
      });
    }, node);

    return () => context.revert();
  }, [stagger, delay]);

  return (
    <div ref={root} data-reveal className={className}>
      {children}
    </div>
  );
}
