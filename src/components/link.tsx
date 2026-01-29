import NextLink, { type LinkProps } from 'next/link'
import React, { forwardRef } from 'react'

export const Link = forwardRef<HTMLAnchorElement, LinkProps & React.ComponentPropsWithoutRef<'a'>>(
  function Link(props, ref) {
    return <NextLink {...props} ref={ref} />
  }
)
