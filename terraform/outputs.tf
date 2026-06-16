output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = aws_vpc.main.id
}

output "eks_cluster_endpoint" {
  description = "The API server endpoint of the EKS cluster"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_certificate_authority_data" {
  description = "The base64 encoded certificate data required to communicate with your EKS cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "kubeconfig_update_command" {
  description = "Command to configure kubectl locally to connect to the new cluster"
  value       = "aws eks --region ${var.aws_region} update-kubeconfig --name ${aws_eks_cluster.main.name}"
}
