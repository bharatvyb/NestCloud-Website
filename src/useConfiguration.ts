import { useSyncExternalStore } from 'react';
import { configs, Configuration } from './config';
import { getConfigurationSnapshot, selectConfiguration, subscribeConfiguration } from './configurationStore';

export function useConfiguration(): [Configuration, (value: Configuration) => void] {
 const selected = useSyncExternalStore(subscribeConfiguration, getConfigurationSnapshot, () => configs[1]);
 return [selected, selectConfiguration];
}
