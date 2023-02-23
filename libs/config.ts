// Inputs that configure this example to run
export interface ExampleConfig {
  rpc: {
    local: string;
    mainnet: string;
  };
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  rpc: {
    local: "http://localhost:8545",
    mainnet: "https://mainnet.infura.io/v3/607f37db34664d4ca32d911fb2639a24",
  },
};
