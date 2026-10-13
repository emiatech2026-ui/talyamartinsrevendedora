import localtunnel from 'localtunnel';

(async () => {
  const tunnel = await localtunnel({ port: 5173, subdomain: 'talyamartins-crm' });

  // the assigned public url for your tunnel
  // i.e. https://abcdefgjhij.localtunnel.me
  console.log('TUNNEL_URL:', tunnel.url);

  tunnel.on('close', () => {
    // tunnels are closed
  });
})();
