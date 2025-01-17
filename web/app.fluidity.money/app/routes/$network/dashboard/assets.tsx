import { useCache } from "~/hooks/useCache";
import { LoaderFunction } from "@remix-run/node";
import { Rewarders } from "~/util/rewardAggregates";
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useParams,
} from "@remix-run/react";
import { Suspense, useContext, useEffect, useState } from "react";
import FluidityFacadeContext from "contexts/FluidityFacade";
import { SplitContext } from "contexts/SplitProvider";
import BN from "bn.js";
import { AnimatePresence, motion } from "framer-motion";
import { getUsdFromTokenAmount, Token } from "~/util/chainUtils/tokens";
import serverConfig from "~/webapp.config.server";
import {
  Text,
  Display,
  Heading,
  ManualCarousel,
  numberToMonetaryString,
  LoadingDots,
  ProviderCard,
  GeneralButton,
} from "@fluidity-money/surfing";
import ConnectWalletModal from "~/components/ConnectWalletModal";
import dashboardAssetsStyle from "~/styles/dashboard/assets.css";

export const links = () => {
  return [{ rel: "stylesheet", href: dashboardAssetsStyle }];
};

export const loader: LoaderFunction = async ({ params }) => {
  const { network } = params;
  const { tokens } = serverConfig.config[network as unknown as string] ?? {};

  return {
    tokens,
  };
};

const getTotalValueOfAssetType = async (
  tokens: Token[],
  assetType: "fluid" | "regular",
  getBalance: (tokenAddr: string) => Promise<BN | undefined>
) => {
  const totalBalance = tokens.reduce(async (acc, token) => {
    if (assetType === "fluid" && !token.isFluidOf) return acc;
    if (assetType === "regular" && token.isFluidOf) return acc;

    const balance: BN | undefined = await getBalance(token.address);

    if (balance) {
      return (await acc) + getUsdFromTokenAmount(balance, token);
    }
    return acc;
  }, Promise.resolve(0));

  return totalBalance;
};

export const ErrorBoundary: React.FC<{ error: Error }> = (props: {
  error: Error;
}) => {
  return (
    <div>
      <h1>Error</h1>
      <p>{props.error.name}</p>
      <p>{props.error.message}</p>
      <p>The stack trace is:</p>
      <pre>{props.error.stack}</pre>
    </div>
  );
};

const AssetsRoot = () => {
  const { showExperiment } = useContext(SplitContext);

  const { network } = useParams();
  const { tokens } = useLoaderData();
  const urlRoot = `/${network}/dashboard/assets`;

  const currentPage = useLocation().pathname;

  const isFluidAssets = currentPage === urlRoot;

  const { data: rewarders } = useCache<Rewarders>(
    `/${network}/query/rewarders`
  );

  const { all: bestPerformingRewarders } = rewarders || { all: [] };

  const navigationMap = [
    {
      name: "Fluid Assets",
      link: urlRoot,
    },
    {
      name: "Regular Assets",
      link: `${urlRoot}/regular`,
    },
  ];

  const { connected, balance, address, connecting } = useContext(
    FluidityFacadeContext
  );

  const [totalWalletValue, setTotalWalletValue] = useState<number | undefined>(
    undefined
  );

  // Toggle Select Chain Modal
  const [walletModalVisibility, setWalletModalVisibility] =
    useState<boolean>(false);

  useEffect(() => {
    if (!connected || !balance) return;

    (async () => {
      const total = await getTotalValueOfAssetType(
        tokens,
        isFluidAssets ? "fluid" : "regular",
        balance
      );
      setTotalWalletValue(total);
    })();
  }, [connected, isFluidAssets]);

  if (!showExperiment("enable-assets-page")) return <></>;

  if (!address && !connecting)
    return (
      <div className="pad-main">
        <Heading>Connect Your Wallet to see your Assets!</Heading>
        <GeneralButton
          version={connected || connecting ? "transparent" : "primary"}
          buttontype="text"
          size={"medium"}
          handleClick={() =>
            connecting ? null : setWalletModalVisibility(true)
          }
          className="connect-wallet-btn"
        >
          {connecting ? `Connecting...` : `Connect Wallet`}
        </GeneralButton>
        <ConnectWalletModal
          visible={walletModalVisibility}
          close={() => setWalletModalVisibility(false)}
        />
      </div>
    );

  return (
    <div className="pad-main">
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2em",
              justifyContent: "center",
              alignItems: "center",
              height: "500px",
            }}
          >
            <LoadingDots />
            <Text>Loading assets...</Text>
          </div>
        }
      >
        <div className="assets-header">
          <div className="assets-balance">
            <Text>
              Total balance of {isFluidAssets ? "Fluid" : "Regular"} Assets
            </Text>

            {/* <Suspense>
                <AnimatedNumber animateToNumber={totalWalletValue ?? 0}/>
              </Suspense> */}
            <Display size="sm">
              {" "}
              {numberToMonetaryString(totalWalletValue || 0)}{" "}
            </Display>
          </div>
          <div className="assets-navigation">
            {navigationMap.map((l, i) => {
              const selected = currentPage === l.link;
              return (
                <Link key={i} to={l.link}>
                  <Text
                    size="lg"
                    prominent={selected}
                    className={selected ? "assets-active-filter" : ""}
                  >
                    {l.name}
                  </Text>
                  {selected && (
                    <motion.div
                      className="assets-active-filter-underline"
                      layoutId="underline"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        <AnimatePresence>
          <Outlet />
        </AnimatePresence>
        <section id="rewarders">
          <Heading className="highest-rewarders" as={"h2"}>
            Highest Rewarders
          </Heading>
          <ManualCarousel scrollBar={true} className="rewards-carousel">
            {bestPerformingRewarders.map((rewarder) => (
              <div className="carousel-card-container" key={rewarder.name}>
                <ProviderCard
                  name={rewarder.name}
                  prize={rewarder.prize}
                  avgPrize={rewarder.avgPrize}
                  size="md"
                />
              </div>
            ))}
          </ManualCarousel>
        </section>
      </Suspense>
    </div>
  );
};

export default AssetsRoot;
