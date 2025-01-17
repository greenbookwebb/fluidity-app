// Copyright 2022 Fluidity Money. All rights reserved. Use of this
// source code is governed by a GPL-style license that can be found in the
// LICENSE.md file.

import { Heading, Text } from "@fluidity-money/surfing";
import styles from "./HowItWorksTemplate.module.scss";

interface ITemplateProps {
  children: string;
  header?: string;
  button?: any;
  info: string[];
}

const HowItWorksTemplate = ({
  children,
  header,
  info,
  button,
}: ITemplateProps) => {
  return (
    <div className={styles.content}>
      <Heading as="h2">{children}</Heading>
      <Text as="p" size={"xl"} prominent={true}>
        {header}
      </Text>
      {info.map((paragraph, i) => (
        <Text as="p" key={`para-${i}`} size={"md"}>
          {paragraph}
        </Text>
      ))}
      {button}
    </div>
  );
};

export default HowItWorksTemplate;
