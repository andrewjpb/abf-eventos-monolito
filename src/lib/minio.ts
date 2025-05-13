import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: 'https://s3.abfti.com.br',
  port: 9001,
  useSSL: false,
  accessKey: process.env.S3_ACCESS_KEY_ID,
  secretKey: process.env.S3_SECRET_ACCESS_KEY,
})

const uploadFileTicket = async (file: File, id: string,) => {
  // Converter o objeto File em um buffer
  const buffer = await file.arrayBuffer();


  // Fazer upload do arquivo usando putObject
  const uploadFileTicket = await minioClient.putObject(
    "eventos",  // nome do bucket
    "tickets/" + id + "/" + file.name, // objeto key (nome do arquivo no S3)
    Buffer.from(buffer), // Converter ArrayBuffer para Buffer
    file.size, // tamanho do arquivo
    {
      'Content-Type': file.type,
    }
  );

  // Retornar a URL ou o caminho para o arquivo
  return uploadFileTicket
}

export { uploadFileTicket }