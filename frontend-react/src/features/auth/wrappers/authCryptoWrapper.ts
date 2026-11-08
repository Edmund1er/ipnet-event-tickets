export const authCryptoWrapper = {
  obfusquerTelephone: (tel: string) => tel.replace(/(\+\d{3})(\d{2})\d{4}(\d{2})/, '$1 $2 **** $3')
};
