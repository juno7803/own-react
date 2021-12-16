import { Element, Fiber } from 'types';

function createTextElement(text: string) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createElement(
  type: string,
  props: any,
  ...children: Element[]
): Element {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === 'object' ? child : createTextElement(child)
      ),
    },
  };
}

function createDom(fiber: Fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type as string);

  const isProperty = (property: string) => property !== 'children';

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((prop) => {
      // @ts-ignore
      dom[prop] = fiber.props[prop];
    });

  return dom;
}

let nextUnitOfWork: Fiber | null = null;

function render(element: Element, container: HTMLElement) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  // TODO create element and add to dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    // parent 가 있으면 dom 도 있겠지만 type check 가 안되서 optional chaning을 한다
    fiber.parent.dom?.appendChild(fiber.dom);
  }

  // TODO create new fibers for children
  const childElements = fiber.props.children as Element[];
  let index = 0;
  let prevSibling: Fiber | null = null;

  while (index < childElements.length) {
    const element = childElements[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling!.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }

  // TODO return(select) next unit of work
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber: Fiber | undefined = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }

  return null;
}

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadline.timeRemaining() < 1;
  }

  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

const junoReact = {
  createElement,
  render,
};

const element = (
  <div>
    <h1>캡스톤 디자인 2</h1>
  </div>
);

const $root = document.getElementById('root') as HTMLElement;
junoReact.render(element, $root);
